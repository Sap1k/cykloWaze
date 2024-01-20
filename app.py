import datetime
from time import sleep

import mysql.connector
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, render_template, request, redirect, url_for

API_KEY_GOLEMIO = "xxx"
app = Flask(__name__)
scheduler = BackgroundScheduler()
gol_header = {
    "X-Access-Token": API_KEY_GOLEMIO}


def cache_data():
    print("Caching data...")
    con = mysql.connector.connect(
        host="localhost",
        user="cyklo_app",
        password="cyklo_heslo",
        database="cyklowaze"
    )
    cur = con.cursor()

    # Fetch list of bike counters
    counter_list = requests.get("https://api.golemio.cz/v2/bicyclecounters?latlng=50.124935,14.457204&range=50000",
                                headers=gol_header).json()
    for counter in counter_list["features"]:
        temp_location = counter["properties"]["id"]
        for counter_dir in counter["properties"]["directions"]:
            counter_dir_id = counter_dir["id"]
            # Check what's the last day in the DB
            cur.execute(
                f"SELECT agr_date FROM data_cache WHERE counter_direction_id = %s ORDER BY agr_date DESC LIMIT 1",
                (counter_dir_id,))
            data = cur.fetchall()

            if len(data) == 0:
                fetch_since = datetime.date.today() - datetime.timedelta(days=7)
            else:
                fetch_since = data[0][0]

            day_to_fetch = fetch_since
            print(counter_dir_id)
            while day_to_fetch <= datetime.date.today():
                cur.execute(
                    f"SELECT agr_date FROM data_cache WHERE counter_direction_id = %s AND agr_date = %s ORDER BY agr_date DESC LIMIT 1",
                    (counter_dir_id,day_to_fetch))
                daily_data = cur.fetchall()
                counter_time_from = day_to_fetch.strftime("%Y-%m-%dT00:00:01.000Z")
                counter_time_to = day_to_fetch.strftime("%Y-%m-%dT23:59:58.999Z")
                dir_daily = requests.get(
                    f"https://api.golemio.cz/v2/bicyclecounters/detections?from={counter_time_from}&to={counter_time_to}&aggregate=true&id={counter_dir_id}",
                    headers=gol_header).json()
                temp = requests.get(
                    f"https://api.golemio.cz/v2/bicyclecounters/temperatures?from={counter_time_from}&to={counter_time_to}&aggregate=true&id={temp_location}",
                    headers=gol_header).json()

                # Make sure values are actually able to be processed by Maria
                if len(dir_daily) > 0:
                    cycle_value = dir_daily[0]["value"]
                    ped_value = dir_daily[0]["value_pedestrians"]
                else:
                    cycle_value = None
                    ped_value = None

                if len(temp) > 0:
                    temp_dbl = temp[0]["value"]
                else:
                    temp_dbl = None

                if len(daily_data) == 0:
                    cur.execute(
                        "INSERT INTO data_cache(counter_id, counter_direction_id, agr_date, tot_cycle, tot_peds, avg_temp) VALUES (%s,%s,%s,%s,%s,%s)",
                        (temp_location, counter_dir_id, day_to_fetch, cycle_value, ped_value,
                         temp_dbl))
                else:
                    cur.execute(
                        "UPDATE data_cache SET tot_cycle = %s, tot_peds = %s, avg_temp = %s WHERE counter_direction_id = %s AND agr_date = %s",
                        (cycle_value, ped_value, temp_dbl, counter_dir_id, day_to_fetch))

                con.commit()

                print(dir_daily)
                print(temp)
                sleep(1.5)
                day_to_fetch = day_to_fetch + datetime.timedelta(days=1)

    # Detemine data quality
    cur.execute("UPDATE data_cache SET quality = 1 WHERE tot_cycle > 0 AND avg_temp != 0 AND avg_temp IS NOT NULL")
    cur.execute("UPDATE data_cache SET quality = 2 WHERE tot_cycle > 0 AND avg_temp = 0 OR avg_temp IS NULL")
    cur.execute("UPDATE data_cache SET quality = 3 WHERE tot_cycle = 0 OR tot_cycle IS NULL;")
    con.commit()

    # Dump json data to look at it closely
    # with open("pocitadla.json", 'w') as f:
    #    f.write(json.dumps(counter_list, indent=4))


#cache_data()
scheduler.add_job(cache_data, 'interval', minutes=20)
scheduler.start()


@app.route('/', methods=['GET'], strict_slashes=False)
def main():  # put application's code here
    return render_template("index.html")


@app.route('/history', methods=['GET', 'POST'], strict_slashes=False)
def history():
    return render_template("history.html")

@app.route('/about', methods=['GET'], strict_slashes=False)
def about_us():
    return render_template("about.html")


@app.route('/details/<id>', methods=['GET'], strict_slashes=False)
def details(id):
    if not id:
        return redirect(url_for('index'))
    return render_template("details.html", id=id)


@app.route('/getMarkerData', methods=['POST'])
def get_marker_data():
    con = mysql.connector.connect(
        host="localhost",
        user="cyklo_app",
        password="cyklo_heslo",
        database="cyklowaze"
    )
    cur = con.cursor()
    counter_id = request.json["counter_id"]

    cur.execute("SELECT DISTINCT counter_direction_id, agr_date, tot_cycle, tot_peds, avg_temp, quality FROM data_cache WHERE agr_date > DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) AND counter_id = %s", (counter_id,))
    data = cur.fetchall()
    data_json = {}

    for device, date, cycles, peds, avg_temp, quality in data:
        if device not in data_json:
            data_json[device] = {}
            data_json[device]["dates"] = []
            data_json[device]["cycles"] = []
            data_json[device]["pedestrians"] = []
            data_json[device]["avg_temp"] = []
            data_json[device]["quality"] = []

        data_json[device]["dates"].append(str(date))
        data_json[device]["cycles"].append(cycles)
        data_json[device]["pedestrians"].append(peds)
        data_json[device]["avg_temp"].append(avg_temp)
        data_json[device]["quality"].append(quality)

    return data_json


@app.route('/markerQuality', methods=['GET'])
def get_marker_quality():
    con = mysql.connector.connect(
        host="localhost",
        user="cyklo_app",
        password="cyklo_heslo",
        database="cyklowaze"
    )
    cur = con.cursor()
    date_yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
    date_to_check = date_yesterday.date()

    cur.execute("SELECT counter_id, SUM(quality) FROM data_cache WHERE agr_date = %s GROUP BY counter_id", (date_to_check,))
    data = cur.fetchall()
    return_data = []
    for row in data:
        if row[1] < 3:
            quality = "good"
        elif row[1] < 5:
            quality = "ok"
        else:
            quality = "bad"

        return_data.append({
            "counter_id": row[0],
            "quality": quality
        })

    return return_data


if __name__ == '__main__':
    app.run()
