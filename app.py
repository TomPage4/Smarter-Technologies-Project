from flask import Flask, redirect, request, render_template, url_for, jsonify, session, send_file
import sqlite3
from flask_socketio import SocketIO
from werkzeug.security import check_password_hash
import json
import os
import zipfile
from datetime import timedelta, datetime
import re
import pytz
import random
import string

app = Flask(__name__)
socketio = SocketIO(app)

app.secret_key = "^()@osE23.Irlwn-s$6I3!>T"

app.permanent_session_lifetime = timedelta(minutes=10)

@app.route("/client-names", methods=["GET"])
def client_names():
    try:
        conn = sqlite3.connect("all_customers.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, created FROM all_customers")
        names = cursor.fetchall()
        conn.close()
        # Handling error if no client names are returned
        if not names:
            return jsonify({"error": "No client names found"}), 404
        return jsonify(names)
    # Handling errors with database connection
    except sqlite3.Error as e:
        return jsonify({"error": "Could not connect to the database"}), 500
    # Handling all other errors
    except Exception as e:
        return jsonify({"error": f"Unexpted error occurred: {str(e)}"}), 500

@app.route("/client-data/<string:customer_id>", methods=["GET"])
def client_data(customer_id):
    try:
        conn = sqlite3.connect("device.db")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM device LIMIT 0")
        column_titles = [description[0] for description in cursor.description]
        conn.close()
        # Handling error if no column titles are returned
        if not column_titles:
            return jsonify({"error": "No data headings found"}), 404
        return jsonify(column_titles)
    # Handling errors with database connection
    except sqlite3.Error as e:
        return jsonify({"error": "Could not connect to the database"}), 500
    # Handling all other errors
    except Exception as e:
        return jsonify({"error": f"Unexpted error occurred: {str(e)}"}), 500#
    
@app.route("/newUser", methods=["GET"])
def new_user():
    if "user" not in session:
        return redirect(url_for("getLogin"))
    return render_template("newUser.html")

@app.route("/")
def index():
    if "user" not in session:
        return redirect(url_for("getLogin"))
    return redirect(url_for("home"))

@app.route("/home", methods=["GET"])
def home():
    if "user" not in session:
        return redirect(url_for("getLogin"))
    return render_template("mainData.html")

@app.route("/dashboard", methods=["GET"])
def dashboard():
    if "user" not in session:
        return redirect(url_for("getLogin"))

    conn = sqlite3.connect("changeLog.db")
    cursor = conn.cursor()
    cursor.execute("SELECT dev_ID, username, changed, info FROM devs ORDER BY changed DESC")
    changelog_data = cursor.fetchall()
    conn.close()
    
    conn = sqlite3.connect("all_customers.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, created, developer FROM all_customers ORDER BY created DESC")
    customer_data = cursor.fetchall()
    conn.close()
    
    return render_template("dash.html", changelog_data=changelog_data, customer_data=customer_data)

def valid_login(username, password):
    conn = sqlite3.connect("devs.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devs WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if user:
        return check_password_hash(user[2], password)
    return False

@app.route("/login", methods=["GET"])
def getLogin():
    return render_template("login.html")

def login_user(username):
    session["user"] = username
    return jsonify({"message": "Login successful"}), 200

@app.route("/login", methods=["POST"])
def login():
    if request.is_json:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if valid_login(username, password):
            return login_user(username)
        else:
            return jsonify({"error": "Invalid Username or Password"}), 401
    else:
        return jsonify({"error": "Invalid request format"}), 400

@app.route("/edit-data", methods=["GET"])
def edit_data():
    # Just checking if theres a user logged in 
    
    if "user" not in session:
        return redirect(url_for("getLogin"))
    
    try:
        encoded_nav_path = request.args.get('data')
        # Handling error if no data was provided in URL
        if not encoded_nav_path:
            return jsonify({"error": "No data provided"}), 400
        try:
            nav_path = json.loads(encoded_nav_path)
            # Handling error if data is in wrong format
            subcats, customerID = findUserSubCats(nav_path)
        except:
            return jsonify({"error": "Parameter not in valid JSON format"}), 400

        return render_template('editData.html', subcats = subcats, customerID = customerID)
    # Handling all other errors
    except Exception as e:
        return jsonify({"error": f"Unexpected error occurred: {str(e)}"}), 500
    
def findUserSubCats(data):
    try:
        # Making database connection
        conn = sqlite3.connect("all_customers.db")
        cursor = conn.cursor()
        
        # Grabbing the customer ID row based on the name of the customer, else returning null
        cursor.execute("SELECT id FROM all_customers WHERE name = ?", (data[1],))
        customer = cursor.fetchone()
        if customer is None:
            conn.close()
            return None
        
        # Gets the ID from the row
        customerID = customer[0]
        
        conn.close()
        
        # Connects to the second database
        conn = sqlite3.connect("device.db")
        cursor = conn.cursor()
        
        # Extracts all columns from the table in metadata form
        cursor.execute("PRAGMA table_info(device);")
        columns = cursor.fetchall()
                
        # col[1] is the column name field in the metadata
        column_names = []
        column_types = []
        
                
        for col in columns:
            # data -1 is the last category and data -2 is its parent
            # concatenating them and searching for both eliminates similar but irrelevant data from being shown
            if f"{data[-2]}.{data[-1]}" in col[1]:
                # Weird error with the dots in the columns so I had to put the tilde in there
                column_names.append(f"`{col[1]}`")
                column_types.append(col[2])
        
        if column_names == []:
            for col in columns:
                # sometimes there are less categories
                if data[-1] in col[1]:
                    column_names.append(f"`{col[1]}`")
                    column_types.append(col[2])
        
        # If the columns exist (they should always exist) then it joins data
        if column_names:
            columns_str = ", ".join(column_names)
            # SQL can take a comma separated list!!
            # this selects all the data under the column names for the customer selected
            cursor.execute(f"SELECT {columns_str} FROM device WHERE customerID = ?", (customerID,))
            values = cursor.fetchone()

            # If the values exist - then they get turned into lists based on how many there are
            if values:
                subcategorySorted = [(column_names[i], values[i], column_types[i]) for i in range(len(column_names))]
            else:
                subcategorySorted = None
        else:
            subcategorySorted = None
        
        conn.close()
        print(subcategorySorted)
        
        # subcategorySorted is a list of lists!!
        return subcategorySorted, customerID
    
    # While I was bugfixing I made this to print the errors
    # https://stackoverflow.com/questions/25371636/how-to-get-sqlite-result-error-codes-in-python
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None
    except Exception as e:
        print(f"General error: {e}")
        return None
    
def generate_random_id(length=20):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

@app.route('/add-client', methods=['POST'])
def add_client():
    try:
        # Ensure the user is logged in
        if "user" not in session:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        
        utc_now = datetime.now(pytz.utc)
        formatted_time = utc_now.isoformat()
        formatted_time_with_z = formatted_time.replace('+00:00', 'Z')

        data = request.get_json()
        client_name = data.get('name')
        longitude = data.get('longitude')
        latitude = data.get('latitude')

        if not client_name or not longitude or not latitude:
            return jsonify({"success": False, "error": "Missing client name or location data."}), 400

        random_id = generate_random_id()
        conn = sqlite3.connect("all_customers.db")
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM all_customers WHERE id = ?", (random_id,))
        count = cursor.fetchone()[0]
        
        while count > 0:
            random_id = generate_random_id()  # makes a new ID if the current one exists
            cursor.execute("SELECT COUNT(*) FROM all_customers WHERE id = ?", (random_id,))
            count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM all_customers WHERE name = ?", (client_name,))
        exists = cursor.fetchone()[0]
        if exists > 0:
            return jsonify({"success": False, "error": "Client already exists"}), 400
        
        cursor.execute("INSERT INTO all_customers (id, name, developer, created, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)", (random_id, client_name, session["user"], formatted_time_with_z, latitude, longitude))
        conn.commit()

        conn = sqlite3.connect("device.db")
        cursor = conn.cursor()

        cursor.execute("PRAGMA table_info(device)")
        columns = cursor.fetchall()
        column_names = [f'"{column[1]}"' for column in columns if column[1] != "customerID"]
        
        cursor.execute("SELECT * FROM device WHERE customerID = ?", ("template",))
        template_customer_data = cursor.fetchone()

        if template_customer_data:
            placeholders = ', '.join(['?'] * len(column_names))
                        
            cursor.execute(f"INSERT INTO device (customerID, {', '.join(column_names)}) VALUES (?, {placeholders})", (random_id,) + tuple(template_customer_data[1:]))
            conn.commit()
        else:
            return jsonify({"success": False, "error": "Template customer not found!"}), 404
        
        conn.close()
        
        return jsonify({"success": True, "new_client_id": random_id}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/submit", methods=["POST"])
def submit():
    if request.is_json:
        try:
            data = request.get_json()
            # making it a list rather than wonky json format
            subcats = data.get("subcats")
            print(subcats)
            customerID = data.get("customerID")
            
            if not subcats or not customerID:
                return jsonify({"error": "Missing subcats or customerID"}), 400
            
            cols = []
            vals = []
            colVals = []
            # getting the rows and columns into respective arrays
            for subcat in subcats:
                cols.append(f"{subcat[0]} = ?")
                vals.append(subcat[1])
                colVals.append(f"{subcat[0]}: {subcat[1]}")
                        
            # making it a comma separated string
            setList = ", ".join(cols)
            colVals = [re.sub(r",", ";", val) for val in colVals]
            changes = ", ".join(colVals)
            
            # making it a tuple so that it can be queried 
            vals.append(customerID)
            
            conn = sqlite3.connect("device.db")
            cursor = conn.cursor()
            # connects all the sets then filters by where, using the customer ID which is added onto the end of the list earlier
            cursor.execute(f"UPDATE device SET {setList} WHERE customerID = ?", tuple(vals))
            conn.commit()
            conn.close()
            
            print(session["user"])
            
            conn = sqlite3.connect("devs.db")
            cursor = conn.cursor()
            cursor.execute("SELECT dev_ID FROM devs WHERE username = ?", (session["user"],))
            dev = cursor.fetchone()
            dev_ID = dev[0]
            conn.close()
            
            utc_now = datetime.now(pytz.utc)

            formatted_time = utc_now.isoformat()

            formatted_time_with_z = formatted_time.replace('+00:00', 'Z')
            
            conn = sqlite3.connect("changeLog.db")
            cursor = conn.cursor()
            cursor.execute("INSERT INTO devs (dev_ID, username, changed, info) VALUES (?, ?, ?, ?)", (dev_ID, session["user"], formatted_time_with_z, changes))
            conn.commit()
            conn.close()
            
            return jsonify({"message": "Data updated successfully"}), 200
        # error processing stuff
        except Exception as e:
            print("Error processing data:", str(e))
            return jsonify({"error": f"An error occurred while processing the data: {str(e)}"}), 400
    else:
        # if the request isnt json then error
        return jsonify({"error": "Request must be JSON"}), 415

@app.route("/backup", methods=["GET"])
def backup():
    # Creates security authentication
    if "user" not in session:
        return redirect(url_for("getLogin"))
    else:
        # Fetching the .db files
        all_customers = "all_customers.db"
        device = "device.db"
        change_log = "changeLog.db"
        # Checking if all 3 files can be found
        if os.path.exists(all_customers) and os.path.exists(device) and os.path.exists(change_log):
            # Create the zip file adding the .db files
            with zipfile.ZipFile("backup.zip", "w") as append_file:
                append_file.write(all_customers, os.path.basename(all_customers))
                append_file.write(device, os.path.basename(device))
                append_file.write(change_log, os.path.basename(change_log))
            # Returning the zip file
            return send_file("backup.zip", as_attachment = True)
        # Dealing with instance of not being able to find the .db files
        else:
            return jsonify({"error": ".db files not found"}), 404
    
@app.route("/export", methods=["GET"])
def export():
    # Creates security authentication
    if "user" not in session:
        return redirect(url_for("getLogin"))
    else:
        try:
            encoded_id = request.args.get('data')
            # Handling error if no data was provided in URL
            if not encoded_id:
                return jsonify({"error": "No data provided"}), 400
            try:
                plain_id = str(json.loads(encoded_id))
            except:
                return jsonify({"error": "Parameter not in valid JSON format"}), 400
            # Connecting to database to retreive titles
            conn = sqlite3.connect("device.db")
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM device LIMIT 0")
            column_titles = [description[0] for description in cursor.description]
            conn.close()
            # Connecting to database to retreive data
            conn = sqlite3.connect("device.db")
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM device WHERE customerID = ?", (plain_id,))
            retreived_data = cursor.fetchall()
            conn.close()
            # Fixing retreived data format
            retreived_data = retreived_data[0]
            # Turning into a dictionary
            titles_to_data = dict(zip(column_titles, retreived_data))
            # Writing dictionary to txt file adding a new line between each on
            with open("exported_user_data.txt", "w") as file:
                for title, data in titles_to_data.items():
                    file.write(f"{title}: {data}\n")
            
            return send_file("exported_user_data.txt", as_attachment = True)

        # Handling all other errors
        except Exception as e:
            return jsonify({"error": f"Unexpected error occurred: {str(e)}"}), 500

@app.route("/get-icon", methods=["GET"])
def get_icon():
    customer_id = request.args.get("customer-id")
    title = request.args.get("title")

    if not customer_id or not title:
        return jsonify({"error": "No id or title received"}), 404
    # Connecting to database to retreive icon name
    conn = sqlite3.connect("device.db")
    cursor = conn.cursor()
    cursor.execute(f'SELECT "{title}" FROM device WHERE customerID = ?', (customer_id,))
    icon_name = cursor.fetchall()
    conn.close()

    return jsonify(icon_name)

@app.route("/delete-user", methods=["GET"])
def delete_user():
    imported_id = request.args.get("exportedID")
    imported_name = request.args.get("name")
    # Handling if no id received
    if not imported_id:
        return jsonify({"error": "No id received"}), 404
    try:
        # Deleting from all_customer.db
        conn = sqlite3.connect("all_customers.db")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM all_customers WHERE id = ?", (imported_id,))
        conn.commit()
        conn.close()
        # Deleting from device.db
        conn = sqlite3.connect("device.db")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM device WHERE customerID = ?", (imported_id,))
        conn.commit()
        conn.close()
        # Adding update to changeLog.db
        # Fetching dev_id      
        conn = sqlite3.connect("devs.db")
        cursor = conn.cursor()
        cursor.execute("SELECT dev_ID FROM devs WHERE username = ?", (session["user"],))
        dev = cursor.fetchone()
        dev_ID = dev[0]
        conn.close()
        # Calculating time changed
        utc_now = datetime.now(pytz.utc)
        formatted_time = utc_now.isoformat()
        formatted_time_with_z = formatted_time.replace('+00:00', 'Z')
        # Adding update to changeLog.db
        conn = sqlite3.connect("changeLog.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO devs (dev_ID, username, changed, info) VALUES (?, ?, ?, ?)", (dev_ID, session["user"], formatted_time_with_z, f"User deleted: {imported_name}"))
        conn.commit()
        conn.close()
        return jsonify({"message": "User deleted successfully"}), 200
    # Handling database connection errors
    except Exception as e:
        return jsonify({"error": f"Unexpected error occurred: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
