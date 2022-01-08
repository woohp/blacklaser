import csv
import io
import ipaddress
import sqlite3
import zipfile


def main():
    conn = sqlite3.connect('geoip2.sqlite')
    cursor = conn.cursor()

    cursor.execute('begin')
    cursor.execute('drop table if exists networks')
    cursor.execute(
        """
create table networks (
    first_address integer,
    last_address integer,
    geoname_id integer,
    postalcode text,
    latitude integer,
    longitude integer,
    accuracy integer
)
"""
    )

    z = zipfile.ZipFile('GeoLite2-City-CSV_20220104.zip')
    with z.open('GeoLite2-City-CSV_20220104/GeoLite2-City-Blocks-IPv4.csv') as f:
        reader = csv.reader(io.TextIOWrapper(f))
        next(reader)  # skip header
        for row in reader:
            if row[0] == '89.46.114.0/24':
                breakpoint()
            network = ipaddress.IPv4Network(row[0])
            if not row[7]:
                continue
            latitude = int(float(row[7]) * 1e5)
            longitude = int(float(row[8]) * 1e5)
            accuracy = int(row[9])
            continue
            cursor.execute(
                'insert into networks (first_address, last_address, geoname_id, postalcode, latitude, longitude, accuracy) values (?, ?, ?, ?, ?, ?, ?)',  # noqa
                (
                    int(network[0]) - 0x80000000, int(network[-1]) - 0x80000000, int(row[1]), row[6], latitude,
                    longitude, accuracy
                ),
            )

    cursor.execute('drop table if exists networks_idx')
    cursor.execute(
        'create virtual table networks_idx using rtree_i32(id integer primary key, first_address, last_address)'
    )
    cursor.execute(
        'insert into networks_idx (id, first_address, last_address) select rowid, first_address, last_address from networks'  # noqa
    )

    cursor.execute('drop table if exists locations')
    cursor.execute(
        '''
create table locations (
    geoname_id int primary key,
    continent_code text,
    continent_name text,
    country_code text,
    country_name text,
    region text,
    province text,
    city text
)'''
    )

    with z.open('GeoLite2-City-CSV_20220104/GeoLite2-City-Locations-en.csv') as f:
        reader = csv.reader(io.TextIOWrapper(f))
        next(reader)  # skip header
        for row in reader:
            cursor.execute(
                'insert into locations (geoname_id, continent_code, continent_name, country_code, country_name, region, province, city) values (?, ?, ?, ?, ?, ?, ?, ?)',  # noqa
                (int(row[0]), row[2], row[3], row[4], row[5], row[7], row[9], row[10])
            )

    cursor.execute('commit')
    cursor.execute('vacuum')
    conn.close()


if __name__ == '__main__':
    main()
