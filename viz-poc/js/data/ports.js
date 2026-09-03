/* Container ports and the lanes between them.
 *
 * Hand-authored, so the page needs no API, no key and no network at runtime.
 * Throughput is annual container volume in millions of TEU, rounded from
 * published 2023 figures — close enough to size a dot honestly, not close
 * enough to quote. Lane weights are a relative sense of how much moves on a
 * corridor, not a measured number: they set arc thickness and pulse rate.
 *
 * lat/lon are decimal degrees, north and east positive.
 */
window.VizPorts = (function () {
    'use strict';

    /* id, name, country, lat, lon, TEU millions/yr, region */
    var PORTS = [
        ['shanghai',   'Shanghai',        'China',        31.23,  121.47, 49.2, 'asia'],
        ['singapore',  'Singapore',       'Singapore',     1.29,  103.85, 39.0, 'asia'],
        ['ningbo',     'Ningbo-Zhoushan', 'China',        29.87,  121.55, 35.3, 'asia'],
        ['shenzhen',   'Shenzhen',        'China',        22.54,  114.06, 29.9, 'asia'],
        ['qingdao',    'Qingdao',         'China',        36.07,  120.38, 28.7, 'asia'],
        ['guangzhou',  'Guangzhou',       'China',        23.10,  113.25, 25.4, 'asia'],
        ['busan',      'Busan',           'South Korea',  35.10,  129.04, 23.0, 'asia'],
        ['tianjin',    'Tianjin',         'China',        38.98,  117.70, 22.2, 'asia'],
        ['hongkong',   'Hong Kong',       'Hong Kong',    22.32,  114.17, 14.3, 'asia'],
        ['jebelali',   'Jebel Ali',       'UAE',          25.01,   55.06, 14.5, 'meast'],
        ['portklang',  'Port Klang',      'Malaysia',      3.00,  101.39, 14.1, 'asia'],
        ['rotterdam',  'Rotterdam',       'Netherlands',  51.95,    4.14, 13.4, 'europe'],
        ['antwerp',    'Antwerp-Bruges',  'Belgium',      51.26,    4.40, 12.5, 'europe'],
        ['xiamen',     'Xiamen',          'China',        24.48,  118.09, 12.5, 'asia'],
        ['tpp',        'Tanjung Pelepas', 'Malaysia',      1.36,  103.55, 10.5, 'asia'],
        ['laemchabang','Laem Chabang',    'Thailand',     13.08,  100.88,  8.7, 'asia'],
        ['losangeles', 'Los Angeles',     'USA',          33.73, -118.26,  8.6, 'namer'],
        ['tangermed',  'Tanger Med',      'Morocco',      35.88,   -5.50,  8.6, 'africa'],
        ['longbeach',  'Long Beach',      'USA',          33.75, -118.19,  8.0, 'namer'],
        ['hcmc',       'Ho Chi Minh City','Vietnam',      10.76,  106.70,  7.9, 'asia'],
        ['newyork',    'New York / NJ',   'USA',          40.67,  -74.05,  7.8, 'namer'],
        ['hamburg',    'Hamburg',         'Germany',      53.53,    9.93,  7.7, 'europe'],
        ['mundra',     'Mundra',          'India',        22.74,   69.70,  7.4, 'india'],
        ['colombo',    'Colombo',         'Sri Lanka',     6.95,   79.84,  6.9, 'india'],
        ['jakarta',    'Tanjung Priok',   'Indonesia',    -6.10,  106.88,  6.5, 'asia'],
        ['nhavasheva', 'Nhava Sheva',     'India',        18.95,   72.95,  6.4, 'india'],
        ['savannah',   'Savannah',        'USA',          32.08,  -81.09,  5.4, 'namer'],
        ['piraeus',    'Piraeus',         'Greece',       37.94,   23.63,  5.0, 'europe'],
        ['santos',     'Santos',          'Brazil',      -23.98,  -46.30,  4.9, 'samer'],
        ['valencia',   'Valencia',        'Spain',        39.44,   -0.31,  4.8, 'europe'],
        ['jeddah',     'Jeddah',          'Saudi Arabia', 21.48,   39.17,  4.6, 'meast'],
        ['algeciras',  'Algeciras',       'Spain',        36.13,   -5.44,  4.5, 'europe'],
        ['salalah',    'Salalah',         'Oman',         16.94,   54.01,  4.5, 'meast'],
        ['portsaid',   'Port Said',       'Egypt',        31.25,   32.30,  4.0, 'meast'],
        ['houston',    'Houston',         'USA',          29.73,  -95.27,  4.0, 'namer'],
        ['felixstowe', 'Felixstowe',      'UK',           51.95,    1.32,  3.6, 'europe'],
        ['vancouver',  'Vancouver',       'Canada',       49.29, -123.10,  3.5, 'namer'],
        ['seattle',    'Seattle-Tacoma',  'USA',          47.27, -122.41,  3.4, 'namer'],
        ['melbourne',  'Melbourne',       'Australia',   -37.83,  144.92,  3.3, 'oceania'],
        ['lehavre',    'Le Havre',        'France',       49.48,    0.11,  3.0, 'europe'],
        ['balboa',     'Balboa',          'Panama',        8.94,  -79.56,  2.9, 'samer'],
        ['yokohama',   'Yokohama',        'Japan',        35.45,  139.66,  2.9, 'asia'],
        ['callao',     'Callao',          'Peru',        -12.05,  -77.15,  2.7, 'samer'],
        ['durban',     'Durban',          'South Africa',-29.87,   31.03,  2.6, 'africa'],
        ['botany',     'Port Botany',     'Australia',   -33.98,  151.22,  2.6, 'oceania'],
        ['manzanillo', 'Manzanillo',      'Mexico',       19.05, -104.31,  3.8, 'namer'],
        ['buenosaires','Buenos Aires',    'Argentina',   -34.60,  -58.37,  1.4, 'samer'],
        ['lagos',      'Lagos',           'Nigeria',       6.44,    3.38,  1.5, 'africa'],
        ['auckland',   'Auckland',        'New Zealand', -36.84,  174.77,  0.9, 'oceania'],
        ['gothenburg', 'Gothenburg',      'Sweden',       57.69,   11.87,  0.9, 'europe']
    ];

    /* from, to, weight (relative), corridor label */
    var LANES = [
        ['shanghai',   'losangeles',  9, 'Trans-Pacific'],
        ['ningbo',     'losangeles',  7, 'Trans-Pacific'],
        ['shenzhen',   'longbeach',   8, 'Trans-Pacific'],
        ['busan',      'longbeach',   6, 'Trans-Pacific'],
        ['qingdao',    'seattle',     4, 'Trans-Pacific'],
        ['shanghai',   'vancouver',   4, 'Trans-Pacific'],
        ['yokohama',   'longbeach',   3, 'Trans-Pacific'],
        ['xiamen',     'manzanillo',  3, 'Trans-Pacific'],

        ['shanghai',   'rotterdam',   9, 'Asia-Europe'],
        ['singapore',  'rotterdam',   7, 'Asia-Europe'],
        ['ningbo',     'hamburg',     6, 'Asia-Europe'],
        ['shenzhen',   'antwerp',     6, 'Asia-Europe'],
        ['busan',      'rotterdam',   4, 'Asia-Europe'],
        ['portklang',  'felixstowe',  4, 'Asia-Europe'],
        ['guangzhou',  'valencia',    3, 'Asia-Europe'],

        ['shanghai',   'singapore',   8, 'Intra-Asia'],
        ['singapore',  'portklang',   6, 'Intra-Asia'],
        ['hongkong',   'singapore',   6, 'Intra-Asia'],
        ['busan',      'shanghai',    6, 'Intra-Asia'],
        ['hcmc',       'singapore',   5, 'Intra-Asia'],
        ['laemchabang','singapore',   5, 'Intra-Asia'],
        ['jakarta',    'singapore',   5, 'Intra-Asia'],
        ['tpp',        'singapore',   4, 'Intra-Asia'],
        ['tianjin',    'busan',       4, 'Intra-Asia'],
        ['xiamen',     'hongkong',    4, 'Intra-Asia'],
        ['yokohama',   'shanghai',    4, 'Intra-Asia'],

        ['rotterdam',  'newyork',     6, 'Transatlantic'],
        ['antwerp',    'savannah',    5, 'Transatlantic'],
        ['hamburg',    'newyork',     4, 'Transatlantic'],
        ['lehavre',    'newyork',     3, 'Transatlantic'],
        ['algeciras',  'houston',     3, 'Transatlantic'],

        ['jebelali',   'singapore',   6, 'Middle East'],
        ['jebelali',   'rotterdam',   5, 'Middle East'],
        ['mundra',     'jebelali',    4, 'Middle East'],
        ['nhavasheva', 'jebelali',    4, 'Middle East'],
        ['colombo',    'singapore',   4, 'Middle East'],
        ['salalah',    'jeddah',      3, 'Middle East'],
        ['nhavasheva', 'colombo',     3, 'Middle East'],

        ['singapore',  'jeddah',      5, 'Suez corridor'],
        ['jeddah',     'piraeus',     4, 'Suez corridor'],
        ['portsaid',   'piraeus',     4, 'Suez corridor'],
        ['piraeus',    'rotterdam',   4, 'Suez corridor'],
        ['tangermed',  'algeciras',   4, 'Suez corridor'],
        ['algeciras',  'rotterdam',   3, 'Suez corridor'],

        ['santos',     'rotterdam',   4, 'South America'],
        ['santos',     'shanghai',    4, 'South America'],
        ['callao',     'shanghai',    3, 'South America'],
        ['buenosaires','santos',      3, 'South America'],
        ['balboa',     'losangeles',  3, 'South America'],
        ['callao',     'balboa',      3, 'South America'],

        ['durban',     'singapore',   3, 'Africa'],
        ['durban',     'shanghai',    3, 'Africa'],
        ['lagos',      'rotterdam',   3, 'Africa'],
        ['tangermed',  'lagos',       2, 'Africa'],

        ['botany',     'singapore',   3, 'Oceania'],
        ['melbourne',  'shanghai',    3, 'Oceania'],
        ['auckland',   'botany',      2, 'Oceania'],

        ['newyork',    'savannah',    3, 'North America'],
        ['houston',    'savannah',    2, 'North America'],
        ['manzanillo', 'longbeach',   3, 'North America'],

        ['rotterdam',  'gothenburg',  2, 'Northern Europe'],
        ['gothenburg', 'hamburg',     2, 'Northern Europe'],
        ['felixstowe', 'rotterdam',   3, 'Northern Europe']
    ];

    /* Inflate the tables into objects once, and hang the lane list off each
     * port so hovering one can light its own lanes without a scan. */
    var byId = {};
    var ports = PORTS.map(function (p) {
        var o = {
            id: p[0], name: p[1], country: p[2],
            lat: p[3], lon: p[4], teu: p[5], region: p[6],
            lanes: []
        };
        byId[o.id] = o;
        return o;
    });

    var lanes = [];
    for (var i = 0; i < LANES.length; i++) {
        var a = byId[LANES[i][0]], b = byId[LANES[i][1]];
        if (!a || !b) continue;   // a typo in the table shouldn't kill the scene
        var lane = { a: a, b: b, weight: LANES[i][2], corridor: LANES[i][3], index: lanes.length };
        a.lanes.push(lane);
        b.lanes.push(lane);
        lanes.push(lane);
    }

    return { ports: ports, lanes: lanes, byId: byId };
})();
