"use strict";
var Util_1 = require("../Util");
var util_1 = require("util");
var JSZip = require("jszip");
var fs = require("fs");
var parse5 = require('parse5');
var http = require('http');
var request = require('request');
var InsightFacade = (function () {
    function InsightFacade() {
        Util_1.default.trace('InsightFacadeImpl::init()');
    }
    InsightFacade.prototype.addDataset = function (id, content) {
        return new Promise(function (resolve, reject) {
            var zip = new JSZip();
            zip.loadAsync(content, { base64: true }).then(function (data) {
                if (id == "courses") {
                    var proList = [];
                    var keys = Object.keys(data);
                    var objkeys_1 = Object.keys(data[keys[0]]);
                    var processed_results_1 = [];
                    for (var i = 1; i < objkeys_1.length; i++) {
                        var file = zip.file(objkeys_1[i]);
                        if (file) {
                            proList.push(file.async("string"));
                        }
                    }
                    Promise.all(proList).then(function (strings) {
                        for (var i = 1; i < objkeys_1.length; i++) {
                            if (strings[i - 1].charAt(0) == "\"")
                                return reject({ code: 400, body: { 'error': "Could not parse JSON" } });
                            var temp = JSON.parse(strings[i - 1]);
                            var temp_keys = Object.keys(temp);
                            if (temp_keys.indexOf('result') < 0 || temp['result'] === undefined)
                                return reject({ code: 400, body: { 'error': "Invalid data inside zip file" } });
                            var results = temp['result'];
                            var clean_input_keys = [
                                'Subject',
                                'Course',
                                'Avg',
                                'Professor',
                                'Title',
                                'Pass',
                                'Fail',
                                'Audit',
                                'id',
                                'Year'
                            ];
                            var clean_output_keys = [
                                'courses_dept',
                                'courses_id',
                                'courses_avg',
                                'courses_instructor',
                                'courses_title',
                                'courses_pass',
                                'courses_fail',
                                'courses_audit',
                                'courses_uuid',
                                'courses_year'
                            ];
                            for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                                var r = results_1[_i];
                                var newo = {};
                                for (var i_1 = 0; i_1 < clean_input_keys.length; i_1++) {
                                    if (clean_input_keys[i_1] === "Year" && r['Section'] === "overall")
                                        newo[clean_output_keys[i_1]] = 1900;
                                    else if (clean_input_keys[i_1] === "Year" && r['Section'] !== "overall")
                                        newo[clean_output_keys[i_1]] = +r[clean_input_keys[i_1]];
                                    else if (clean_input_keys[i_1] === "id")
                                        newo[clean_output_keys[i_1]] = r[clean_input_keys[i_1]].toString();
                                    else
                                        newo[clean_output_keys[i_1]] = r[clean_input_keys[i_1]];
                                }
                                processed_results_1.push(newo);
                            }
                        }
                        if (processed_results_1.length === 0)
                            return reject({ code: 400, body: { 'error': "Nothing to write" } });
                        if (fs.existsSync("./data")) {
                            if (fs.existsSync("./data/" + id + ".dat")) {
                                console.log("rewriting...");
                                fs.writeFileSync("./data/" + id + ".dat", JSON.stringify(processed_results_1));
                                return resolve({ code: 201, body: {} });
                            }
                            else {
                                var path = "./data/" + id + ".dat";
                                fs.writeFileSync(path, JSON.stringify(processed_results_1));
                                return resolve({ code: 204, body: {} });
                            }
                        }
                        else {
                            fs.mkdirSync("./data");
                            var path = "./data/" + id + ".dat";
                            fs.writeFileSync(path, JSON.stringify(processed_results_1));
                            return resolve({ code: 204, body: {} });
                        }
                    }).catch(function (err) {
                        return reject({ code: 400, body: { "error": err.toString() } });
                    });
                }
                else {
                    var proList_1 = [];
                    var keys = Object.keys(data);
                    var objkeys_2 = Object.keys(data[keys[0]]);
                    var rooms_1 = [];
                    var building_list_1 = [];
                    zip.file("index.htm").async("string").then(function (data) {
                        var parsed = parse5.parse(data);
                        index_tree_helper(parsed, building_list_1);
                        for (var i = 1; i < objkeys_2.length; i++) {
                            var file = zip.file(objkeys_2[i]);
                            if (file && building_list_1.indexOf(objkeys_2[i].split("campus/discover/buildings-and-classrooms/")[1]) > -1) {
                                proList_1.push(file.async("string"));
                            }
                        }
                        Promise.all(proList_1).then(function (strings) {
                            for (var _i = 0, strings_1 = strings; _i < strings_1.length; _i++) {
                                var s = strings_1[_i];
                                var buildingInfo = [];
                                var rooms_shortnames = [];
                                var rooms_numbers = [];
                                var rooms_names = [];
                                var rooms_seats = [];
                                var rooms_types = [];
                                var rooms_furnitures = [];
                                var rooms_hrefs = [];
                                var tree = parse5.parse(s);
                                building_tree_helper(tree, buildingInfo, rooms_shortnames, rooms_numbers, rooms_names, rooms_seats, rooms_types, rooms_furnitures, rooms_hrefs);
                                if (rooms_shortnames.length !== 0) {
                                    for (var i = 0; i < rooms_shortnames.length; i++) {
                                        var room = {
                                            rooms_fullname: buildingInfo[0],
                                            rooms_shortname: rooms_shortnames[i],
                                            rooms_number: rooms_numbers[i],
                                            rooms_name: rooms_names[i],
                                            rooms_address: buildingInfo[1],
                                            rooms_lat: 0,
                                            rooms_lon: 0,
                                            rooms_seats: rooms_seats[i],
                                            rooms_type: rooms_types[i],
                                            rooms_furniture: rooms_furnitures[i],
                                            rooms_href: rooms_hrefs[i]
                                        };
                                        rooms_1.push(room);
                                    }
                                }
                            }
                            var geo_proList = [];
                            for (var _a = 0, rooms_2 = rooms_1; _a < rooms_2.length; _a++) {
                                var rm = rooms_2[_a];
                                geo_proList.push(geo_helper(rm));
                            }
                            Promise.all(geo_proList).then(function (values) {
                                var parsed = JSON.parse(JSON.stringify(values));
                                for (var i = 0; i < parsed.length; i++) {
                                    var parsed_p = JSON.parse(parsed[i]);
                                    rooms_1[i].rooms_lat = +parsed_p.lat;
                                    rooms_1[i].rooms_lon = +parsed_p.lon;
                                }
                                if (rooms_1.length === 0)
                                    return reject({ code: 400, body: { 'error': "Nothing to write" } });
                                if (fs.existsSync("./data")) {
                                    if (fs.existsSync("./data/" + id + ".dat")) {
                                        console.log("rewriting...");
                                        fs.writeFileSync("./data/" + id + ".dat", JSON.stringify(rooms_1));
                                        return resolve({ code: 201, body: {} });
                                    }
                                    else {
                                        var path = "./data/" + id + ".dat";
                                        fs.writeFileSync(path, JSON.stringify(rooms_1));
                                        return resolve({ code: 204, body: {} });
                                    }
                                }
                                else {
                                    fs.mkdirSync("./data");
                                    var path = "./data/" + id + ".dat";
                                    fs.writeFileSync(path, JSON.stringify(rooms_1));
                                    return resolve({ code: 204, body: {} });
                                }
                            });
                        }).catch(function (err) {
                            return reject({ code: 400, body: { "error": err.toString() } });
                        });
                    }).catch(function (err) {
                        return reject({ code: 400, body: { "error": err.toString() } });
                    });
                }
            }).catch(function (err) {
                return reject({ code: 400, body: { "error": err.toString() } });
            });
        });
    };
    InsightFacade.prototype.removeDataset = function (id) {
        return new Promise(function (resolve, reject) {
            var path = "./data/" + id + ".dat";
            if (!fs.existsSync("./data") || !fs.existsSync(path)) {
                reject({ code: 404, body: {} });
            }
            else {
                fs.unlinkSync(path);
                resolve({ code: 204, body: {} });
            }
        });
    };
    InsightFacade.prototype.performQuery = function (query) {
        return new Promise(function (resolve, reject) {
            var query_keys = Object.keys(query);
            if (query_keys.length < 2) {
                return reject({ code: 400, body: { "error": "Invalid query: missing where or options 1" } });
            }
            else if (query_keys.indexOf("WHERE") < 0 || query_keys.indexOf("OPTIONS") < 0) {
                return reject({ code: 400, body: { "error": "Invalid query: missing where or options 2" } });
            }
            var missing = [];
            var c_list = [];
            var ids = [];
            var response1 = validateOptions(JSON.parse(JSON.stringify(query))["OPTIONS"], missing, c_list, ids);
            var groupByRes = [];
            var applyBy = [];
            if (JSON.parse(JSON.stringify(query))["TRANSFORMATIONS"]) {
                var target = JSON.parse(JSON.stringify(query))["TRANSFORMATIONS"];
                var response3 = validateTransformation(target, groupByRes, applyBy, ids);
                var apply_keys = [];
                if (response3 !== true) {
                    return reject(response3);
                }
                for (var _i = 0, applyBy_1 = applyBy; _i < applyBy_1.length; _i++) {
                    var ap = applyBy_1[_i];
                    var k = Object.keys(ap);
                    var val = k[0];
                    apply_keys.push(val);
                }
                for (var _a = 0, groupByRes_1 = groupByRes; _a < groupByRes_1.length; _a++) {
                    var g = groupByRes_1[_a];
                    if (apply_keys.indexOf(g) >= 0)
                        return reject({ code: 400, body: { "error": "Invalid query: GROUP cannot have apply key" } });
                    else if (g.split("_").length === 2 && ids.indexOf(g.split("_")[0]) < 0)
                        return reject({ code: 400, body: { "error": "Invalid query: Cannot perform on 2 sets" } });
                }
                for (var _b = 0, c_list_1 = c_list; _b < c_list_1.length; _b++) {
                    var c = c_list_1[_b];
                    if (groupByRes.indexOf(c) < 0 && apply_keys.indexOf(c) < 0)
                        return reject({ code: 400, body: { "error": "Invalid query: All columns should be in group or apply" } });
                }
            }
            if (response1 !== null) {
                return reject(response1);
            }
            else if (missing.length > 0) {
                return reject({ code: 424, body: { "missing": missing } });
            }
            else {
                var response2 = validateWhere(JSON.parse(JSON.stringify(query))["WHERE"], missing, c_list, ids);
                if (missing.length > 0) {
                    return reject({ code: 424, body: missing });
                }
                else if (response2 !== true) {
                    return reject(response2);
                }
            }
            var where = JSON.parse(JSON.stringify(query))["WHERE"];
            var json;
            if (ids.length > 0) {
                if (fs.readFileSync("./data/" + ids[0] + ".dat"))
                    json = fs.readFileSync("./data/" + ids[0] + ".dat").toString();
            }
            var jonj = JSON.parse(json);
            var filtered_data;
            if (Object.keys(where).length === 0) {
                filtered_data = jonj;
            }
            else {
                var keys = Object.keys(where)[0];
                var filter = where[keys];
                filtered_data = helper(keys, filter, jonj);
            }
            var final_result;
            if (Object.keys(groupByRes).length === 0) {
                final_result = filtered_data;
            }
            else {
                var groupData;
                groupData = groupBy_helper(filtered_data, groupByRes);
                var apply_result;
                if (Object.keys(applyBy).length === 0) {
                    var key3 = Object.keys(groupData);
                    apply_result = JSON.parse(JSON.stringify(key3));
                    for (var i = 0; i < apply_result.length; i++) {
                        var temp = JSON.parse(apply_result[i]);
                        apply_result[i] = temp;
                    }
                }
                else {
                    apply_result = apply_helper(groupData, applyBy);
                }
                final_result = apply_result;
            }
            var column = JSON.parse(JSON.stringify(query))["OPTIONS"]["COLUMNS"];
            var retData = [];
            var _loop_1 = function (v) {
                var newEntry = {};
                column.forEach(function (k) {
                    return newEntry[k] = v.hasOwnProperty(k) ? v[k] : null;
                });
                retData.push(newEntry);
            };
            for (var _c = 0, final_result_1 = final_result; _c < final_result_1.length; _c++) {
                var v = final_result_1[_c];
                _loop_1(v);
            }
            if (!util_1.isUndefined(JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"])) {
                if (!util_1.isUndefined(JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"]["dir"])) {
                    var dir = JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"]["dir"];
                    var order_1 = JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"]["keys"];
                    if (dir == "UP") {
                        retData.sort(function (a, b) {
                            return sortingup(a, b, order_1);
                        });
                    }
                    else {
                        retData.sort(function (a, b) {
                            return sortingdown(a, b, order_1);
                        });
                    }
                }
                else {
                    var order_2 = JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"];
                    retData.sort(function (a, b) {
                        if (a[order_2] > b[order_2]) {
                            return 1;
                        }
                        else if (a[order_2] < b[order_2]) {
                            return -1;
                        }
                        else
                            return 0;
                    });
                }
            }
            var re = {
                render: 'TABLE',
                result: retData
            };
            return resolve({ code: 200, body: re });
        });
    };
    return InsightFacade;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InsightFacade;
function sortingup(a, b, order) {
    for (var i = 0; i < order.length; i++) {
        if ((a[order[i]] > b[order[i]])) {
            return 1;
        }
        else if ((a[order[i]] == b[order[i]])) {
            if (i != order.length - 1) {
                continue;
            }
            else {
                return 0;
            }
        }
        else {
            return -1;
        }
    }
}
function sortingdown(a, b, order) {
    for (var i = 0; i < order.length; i++) {
        if ((a[order[i]] < b[order[i]])) {
            return 1;
        }
        else if ((a[order[i]] == b[order[i]])) {
            if (i != order.length - 1) {
                continue;
            }
            else {
                return 0;
            }
        }
        else {
            return -1;
        }
    }
}
function apply_helper(data, apply) {
    var key3 = Object.keys(data);
    var apply_result = JSON.parse(JSON.stringify(key3));
    for (var i = 0; i < apply_result.length; i++) {
        var temp = JSON.parse(apply_result[i]);
        apply_result[i] = temp;
    }
    for (var _i = 0, apply_1 = apply; _i < apply_1.length; _i++) {
        var a = apply_1[_i];
        var keys = Object.keys(a);
        var b = keys[0];
        var k = a[b];
        var key2 = Object.keys(k);
        var b2 = key2[0];
        var k2 = k[b2];
        var result = [];
        switch (b2) {
            case "MAX":
                for (var _a = 0, key3_1 = key3; _a < key3_1.length; _a++) {
                    var e = key3_1[_a];
                    var comparearray = [];
                    var v = data[e];
                    for (var _b = 0, _c = data[e]; _b < _c.length; _b++) {
                        var vv = _c[_b];
                        comparearray.push(vv[k2]);
                    }
                    var max = Math.max.apply(null, comparearray);
                    var ret = {};
                    ret[b] = max;
                    var newkey = JSON.stringify(ret);
                    result.push(JSON.parse(newkey));
                }
                break;
            case "MIN":
                for (var _d = 0, key3_2 = key3; _d < key3_2.length; _d++) {
                    var e = key3_2[_d];
                    var comparearray = [];
                    for (var _e = 0, _f = data[e]; _e < _f.length; _e++) {
                        var vv = _f[_e];
                        comparearray.push(vv[k2]);
                    }
                    var min = Math.min.apply(null, comparearray);
                    var ret = {};
                    ret[b] = min;
                    var newkey = JSON.stringify(ret);
                    result.push(JSON.parse(newkey));
                }
                break;
            case "AVG":
                for (var _g = 0, key3_3 = key3; _g < key3_3.length; _g++) {
                    var e = key3_3[_g];
                    var comparearray = [];
                    var v = data[e];
                    for (var _h = 0, _j = data[e]; _h < _j.length; _h++) {
                        var vv = _j[_h];
                        comparearray.push(vv[k2]);
                    }
                    for (var i_2 = 0; i_2 < comparearray.length; i_2++) {
                        comparearray[i_2] *= 10;
                        comparearray[i_2] = Number(comparearray[i_2].toFixed(0));
                    }
                    var sum_1 = 0;
                    for (var _k = 0, comparearray_1 = comparearray; _k < comparearray_1.length; _k++) {
                        var k_1 = comparearray_1[_k];
                        sum_1 = sum_1 + k_1;
                    }
                    var avg = sum_1 / (comparearray.length);
                    avg = avg / 10;
                    var res = Number(avg.toFixed(2));
                    var ret = {};
                    ret[b] = res;
                    var newkey = JSON.stringify(ret);
                    result.push(JSON.parse(newkey));
                }
                break;
            case "COUNT":
                for (var _l = 0, key3_4 = key3; _l < key3_4.length; _l++) {
                    var e = key3_4[_l];
                    var v = data[e];
                    var store = [];
                    var cont = 0;
                    for (var _m = 0, _o = data[e]; _m < _o.length; _m++) {
                        var vv = _o[_m];
                        if (store.indexOf(vv[k2]) == -1) {
                            cont++;
                            store.push(vv[k2]);
                        }
                    }
                    var ret = {};
                    ret[b] = cont;
                    var newkey = JSON.stringify(ret);
                    result.push(JSON.parse(newkey));
                }
                break;
            case "SUM":
                for (var _p = 0, key3_5 = key3; _p < key3_5.length; _p++) {
                    var e = key3_5[_p];
                    var comparearray = [];
                    var v = data[e];
                    for (var _q = 0, _r = data[e]; _q < _r.length; _q++) {
                        var vv = _r[_q];
                        comparearray.push(vv[k2]);
                    }
                    var sum = comparearray.reduce(function (a, b) { return a + b; }, 0);
                    var ret = {};
                    ret[b] = sum;
                    var newkey = JSON.stringify(ret);
                    result.push(JSON.parse(newkey));
                }
                break;
        }
        for (var i = 0; i < apply_result.length; i++) {
            var result2 = Object.assign({}, apply_result[i], result[i]);
            apply_result[i] = result2;
        }
    }
    return apply_result;
}
function geo_helper(room) {
    return new Promise(function (resolve, reject) {
        var uri = encodeURIComponent(room.rooms_address);
        var url = "http://skaha.cs.ubc.ca:11316/api/v1/team185/" + uri;
        request(url, function (err, res, body) {
            if (!err && res.statusCode === 200)
                return resolve(body);
            else
                return reject(err);
        });
    });
}
function index_tree_helper(node, list) {
    var nodeKeys = Object.keys(node);
    if (nodeKeys.indexOf('attrs') > -1) {
        var attrs = node.attrs;
        for (var _i = 0, attrs_1 = attrs; _i < attrs_1.length; _i++) {
            var at = attrs_1[_i];
            if (at.name == 'class' && at.value == 'views-field views-field-field-building-code') {
                list.push(node.childNodes[0].value.split('\n')[1].replace(/ /g, ''));
            }
        }
    }
    if (nodeKeys.indexOf('childNodes') > -1) {
        var children = node.childNodes;
        for (var _a = 0, children_1 = children; _a < children_1.length; _a++) {
            var child = children_1[_a];
            index_tree_helper(child, list);
        }
    }
}
function building_tree_helper(node, buildingInfo, rooms_shortnames, rooms_numbers, rooms_names, rooms_seats, rooms_types, rooms_furnitures, rooms_hrefs) {
    var key_list = [
        "views-field views-field-field-room-number",
        "views-field views-field-field-room-capacity",
        "views-field views-field-field-room-furniture",
        "views-field views-field-field-room-type",
    ];
    var nodeKeys = Object.keys(node);
    if (nodeKeys.indexOf('attrs') > -1) {
        var attrs = node.attrs;
        for (var _i = 0, attrs_2 = attrs; _i < attrs_2.length; _i++) {
            var at = attrs_2[_i];
            var shortname = void 0;
            var href = void 0;
            var number = void 0;
            var room_name = void 0;
            var seats = void 0;
            var type = void 0;
            var furniture = void 0;
            if (at.name === "class") {
                switch (at.value) {
                    case key_list[0]:
                        if (typeof node.childNodes !== 'undefined') {
                            for (var _a = 0, _b = node.childNodes; _a < _b.length; _a++) {
                                var kid = _b[_a];
                                if (typeof kid.childNodes !== 'undefined' && kid.attrs.length != 0) {
                                    for (var _c = 0, _d = kid.attrs; _c < _d.length; _c++) {
                                        var att = _d[_c];
                                        if (att.name == "href")
                                            href = att.value;
                                    }
                                    room_name = href.split("/room/")[1].replace("-", "_");
                                    number = room_name.split("_")[1];
                                    shortname = room_name.split("_")[0];
                                    rooms_shortnames.push(shortname);
                                    rooms_names.push(room_name);
                                    rooms_numbers.push(number);
                                    rooms_hrefs.push(href);
                                }
                            }
                        }
                        break;
                    case key_list[1]:
                        if (typeof node.childNodes !== 'undefined') {
                            if (node.childNodes[0].value.replace(/^\D+/g, '') !== '') {
                                seats = node.childNodes[0].value.replace(/^\D+/g, '');
                                rooms_seats.push(+seats);
                            }
                        }
                        break;
                    case key_list[2]:
                        if (typeof node.childNodes !== 'undefined') {
                            if (node.childNodes[0].value.replace(/\r?\n|\r/g, '').trim() != 'Furniture type') {
                                furniture = node.childNodes[0].value.replace(/\r?\n|\r/g, '').trim();
                                rooms_furnitures.push(furniture);
                            }
                        }
                        break;
                    case key_list[3]:
                        if (typeof node.childNodes !== 'undefined') {
                            if (node.childNodes[0].value.replace(/\r?\n|\r/g, '').trim() != 'Room type') {
                                type = node.childNodes[0].value.replace(/\r?\n|\r/g, '').trim();
                                rooms_types.push(type);
                            }
                        }
                        break;
                    case "field-content":
                        var target_node = node.childNodes[0];
                        if (typeof target_node !== 'undefined' && typeof target_node.value !== 'undefined')
                            if (target_node.value.indexOf('Building Hours') < 0)
                                buildingInfo.push(target_node.value);
                        break;
                }
            }
        }
    }
    if (nodeKeys.indexOf('childNodes') > -1) {
        var children = node.childNodes;
        for (var _e = 0, children_2 = children; _e < children_2.length; _e++) {
            var child = children_2[_e];
            building_tree_helper(child, buildingInfo, rooms_shortnames, rooms_numbers, rooms_names, rooms_seats, rooms_types, rooms_furnitures, rooms_hrefs);
        }
    }
}
function intersect(a, b) {
    if (a.length == 0) {
        return a;
    }
    var re = [];
    var actualTags = a.map(function (obj) {
        return (+obj.courses_uuid || obj.rooms_name);
    });
    for (var _i = 0, b_1 = b; _i < b_1.length; _i++) {
        var bb = b_1[_i];
        if ((actualTags.indexOf(+bb.courses_uuid) >= 0) || (actualTags.indexOf(bb.rooms_name) >= 0)) {
            re.push(bb);
        }
    }
    return re;
}
function union(a, b) {
    if (a.length == 0) {
        return b;
    }
    var re = [];
    var actualTags = a.map(function (obj) {
        return (+obj.courses_uuid || obj.rooms_name);
    });
    var b_after = b.filter(function (bb) {
        return ((actualTags.indexOf(+bb.courses_uuid) < 0) && (actualTags.indexOf(bb.rooms_name) < 0));
    });
    re = b_after.concat(a);
    return re;
}
function groupBy_helper(list, gp) {
    var groups = {};
    var _loop_2 = function () {
        var newEntry = {};
        gp.forEach(function (k) {
            return newEntry[k] = list[i].hasOwnProperty(k) ? list[i][k] : null;
        });
        var group = JSON.stringify(newEntry);
        if (group in groups) {
            groups[group].push(list[i]);
        }
        else {
            groups[group] = [list[i]];
        }
    };
    for (var i = 0; i < list.length; i++) {
        _loop_2();
    }
    return groups;
}
function helper(key, filter, coursedata) {
    switch (key) {
        case "AND":
            var results = [];
            for (var _i = 0, filter_1 = filter; _i < filter_1.length; _i++) {
                var k = filter_1[_i];
                var keys = Object.keys(k);
                var a = keys[0];
                var b = k[a];
                var result = helper(a, b, coursedata);
                results.push(result);
            }
            var last = [];
            if (results.length >= 1) {
                last = results[0];
            }
            for (var _a = 0, results_2 = results; _a < results_2.length; _a++) {
                var r = results_2[_a];
                if (results.indexOf(r) == 0) {
                    continue;
                }
                last = intersect(last, r);
            }
            return last;
        case "OR":
            var results = [];
            for (var _b = 0, filter_2 = filter; _b < filter_2.length; _b++) {
                var k = filter_2[_b];
                var keys = Object.keys(k);
                var a = keys[0];
                var b = k[a];
                var result = helper(a, b, coursedata);
                results.push(result);
            }
            var last = [];
            for (var _c = 0, results_3 = results; _c < results_3.length; _c++) {
                var r = results_3[_c];
                last = union(last, r);
            }
            return last;
        case "NOT":
            var a = Object.keys(filter)[0];
            var b = filter[a];
            var result = helper(a, b, coursedata);
            var courses = [];
            var numbers = [];
            for (var _d = 0, result_1 = result; _d < result_1.length; _d++) {
                var n = result_1[_d];
                numbers.push(+n['courses_uuid'] || n['rooms_name']);
            }
            for (var _e = 0, coursedata_1 = coursedata; _e < coursedata_1.length; _e++) {
                var v = coursedata_1[_e];
                if ((numbers.indexOf(+v['courses_uuid']) < 0) && (numbers.indexOf(v['rooms_name']) < 0)) {
                    courses.push(v);
                }
            }
            return courses;
        case "EQ":
            var query_keys = Object.keys(filter)[0];
            var query_number = filter[query_keys];
            var courses = [];
            for (var _f = 0, coursedata_2 = coursedata; _f < coursedata_2.length; _f++) {
                var v = coursedata_2[_f];
                if (v[query_keys] == query_number) {
                    courses.push(v);
                }
            }
            return courses;
        case "GT":
            var query_keys = Object.keys(filter)[0];
            var query_number = filter[query_keys];
            var courses = [];
            for (var _g = 0, coursedata_3 = coursedata; _g < coursedata_3.length; _g++) {
                var v = coursedata_3[_g];
                if (v[query_keys] > query_number) {
                    courses.push(v);
                }
            }
            return courses;
        case "LT":
            var query_keys = Object.keys(filter)[0];
            var query_number = filter[query_keys];
            var courses = [];
            for (var _h = 0, coursedata_4 = coursedata; _h < coursedata_4.length; _h++) {
                var v = coursedata_4[_h];
                if (v[query_keys] < query_number) {
                    courses.push(v);
                }
            }
            return courses;
        case "IS":
            var query_keys = Object.keys(filter)[0];
            var query_number = filter[query_keys];
            var courses = [];
            for (var _j = 0, coursedata_5 = coursedata; _j < coursedata_5.length; _j++) {
                var v = coursedata_5[_j];
                if (query_number.indexOf("*") == 0 && query_number.length > 1) {
                    if (query_number.indexOf("*", 1) == query_number.length - 1) {
                        if (v[query_keys].toString().includes(query_number.substring(1, query_number.length - 1))) {
                            courses.push(v);
                        }
                    }
                    else {
                        if (v[query_keys].toString().endsWith(query_number.substring(1))) {
                            courses.push(v);
                        }
                    }
                }
                else if (query_number.indexOf("*") == query_number.length - 1 && query_number.length > 1) {
                    if (v[query_keys].toString().startsWith(query_number.substring(0, query_number.length - 1))) {
                        courses.push(v);
                    }
                }
                else {
                    if (v[query_keys].toString() == query_number) {
                        courses.push(v);
                    }
                }
            }
            return courses;
        default:
            throw new Error("not valid filter");
    }
}
function validateOptions(options, missing, c_list, ids) {
    var opt_keys = Object.keys(options);
    if (opt_keys.length < 2)
        return { code: 400, body: { "error": "Invalid query by options length" } };
    else if (opt_keys.indexOf("COLUMNS") < 0 || opt_keys.indexOf("FORM") < 0)
        return { code: 400, body: { "error": "Invalid query by option type" } };
    else {
        var columns = options["COLUMNS"];
        var order = options["ORDER"];
        var form = options["FORM"];
        if (form == null || form != "TABLE")
            return { code: 400, body: { "error": "Invalid query: FORM" } };
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var c = columns_1[_i];
            var slices = c.split("_");
            if (!fs.existsSync("./data/" + slices[0] + ".dat") && slices.length > 1) {
                if (missing.indexOf(slices[0]) < 0)
                    missing.push(slices[0]);
            }
            if (c_list.indexOf(c) < 0) {
                c_list.push(c);
            }
            if (ids.indexOf(slices[0]) < 0 && slices.length > 1) {
                ids.push(slices[0]);
            }
        }
        if (ids.length === 1 && ids[0] === "courses") {
            if (!fs.existsSync("./data/" + ids[0] + ".dat"))
                if (missing.indexOf(ids[0]) < 0)
                    missing.push(ids[0]);
        }
        else if (ids.length === 1 && ids[0] === "rooms") {
            if (!fs.existsSync("./data/" + ids[0] + ".dat"))
                if (missing.indexOf(ids[0]) < 0)
                    missing.push(ids[0]);
        }
        else if (ids.length > 1 && missing.length < 1) {
            return { code: 400, body: { "error": "Invalid query: Too many data sets" } };
        }
        if (order != null && typeof order === "string") {
            if (c_list.indexOf(order) < 0) {
                return { code: 400, body: { "error": "Invalid query: ORDER" } };
            }
        }
        else if (order != null && typeof order === "object") {
            var orderKeys = Object.keys(order);
            if (orderKeys.length !== 2 || orderKeys.indexOf("dir") < 0 || orderKeys.indexOf("keys") < 0)
                return { code: 400, body: { "error": "Invalid query: ORDER format" } };
            var dir = order["dir"];
            var keys = order["keys"];
            if (dir !== "UP" && dir !== "DOWN")
                return { code: 400, body: { "error": "Invalid query: dir value invalid" } };
            if (keys.length === 0)
                return { code: 400, body: { "error": "Invalid query: keys cannot be empty" } };
            else {
                for (var _a = 0, keys_1 = keys; _a < keys_1.length; _a++) {
                    var val = keys_1[_a];
                    if (c_list.indexOf(val) < 0)
                        return { code: 400, body: { "error": "Invalid query: order keys need to be in columns" } };
                }
            }
        }
        var clean_output_keys = [];
        if (ids.length === 1 && ids[0] === "courses") {
            clean_output_keys =
                [
                    'dept',
                    'id',
                    'avg',
                    'instructor',
                    'title',
                    'pass',
                    'fail',
                    'audit',
                    'uuid',
                    'year'
                ];
            if (!fs.existsSync("./data/" + ids[0] + ".dat"))
                if (missing.indexOf(ids[0]) < 0)
                    missing.push(ids[0]);
        }
        else if (ids.length === 1 && ids[0] === "rooms") {
            clean_output_keys =
                [
                    'fullname',
                    'shortname',
                    'address',
                    'number',
                    'name',
                    'lat',
                    'lon',
                    'seats',
                    'type',
                    'furniture',
                    'href'
                ];
            if (!fs.existsSync("./data/" + ids[0] + ".dat"))
                if (missing.indexOf(ids[0]) < 0)
                    missing.push(ids[0]);
        }
        else if (ids.length > 1 && missing.length < 1) {
            return { code: 400, body: { "error": "Invalid query: Too much data sets" } };
        }
        if (c_list.length <= 0)
            return { code: 400, body: { "error": "Invalid query: COLUMNS" } };
        else {
            for (var _b = 0, c_list_2 = c_list; _b < c_list_2.length; _b++) {
                var c = c_list_2[_b];
                if (c.split("_").length === 2 && clean_output_keys.indexOf(c.split("_")[1]) < 0)
                    return { code: 400, body: { "error": "Invalid query: COLUMNS" } };
            }
        }
        return null;
    }
}
function validateWhere(target, missing, c_list, ids) {
    var where_keys = Object.keys(target);
    if (where_keys.length === 0)
        return true;
    var return_list = [];
    var clean_output_keys = [];
    if (ids.length === 1 && ids[0] === "courses") {
        clean_output_keys =
            [
                'dept',
                'id',
                'avg',
                'instructor',
                'title',
                'pass',
                'fail',
                'audit',
                'uuid',
                'year'
            ];
        if (!fs.existsSync("./data/" + ids[0] + ".dat"))
            if (missing.indexOf(ids[0]) < 0)
                missing.push(ids[0]);
    }
    else if (ids.length === 1 && ids[0] === "rooms") {
        clean_output_keys =
            [
                'fullname',
                'shortname',
                'address',
                'number',
                'name',
                'lat',
                'lon',
                'seats',
                'type',
                'furniture',
                'href'
            ];
        if (!fs.existsSync("./data/" + ids[0] + ".dat"))
            if (missing.indexOf(ids[0]) < 0)
                missing.push(ids[0]);
    }
    else if (ids.length > 1 && missing.length < 1) {
        return { code: 400, body: { "error": "Invalid query: Too much data sets" } };
    }
    for (var k in where_keys) {
        var key_string = void 0;
        switch (where_keys[k]) {
            case 'AND':
                if (target[where_keys[k]].length < 1)
                    return { code: 400, body: { "error": "AND should have at least one filter" } };
                for (var _i = 0, _a = target[where_keys[k]]; _i < _a.length; _i++) {
                    var t = _a[_i];
                    var local_res_1 = validateWhere(t, missing, c_list, ids);
                    if (local_res_1 != true)
                        return_list.push(local_res_1);
                }
                break;
            case 'OR':
                if (target[where_keys[k]].length < 1)
                    return { code: 400, body: { "error": "OR should have at least one filter" } };
                for (var _b = 0, _c = target[where_keys[k]]; _b < _c.length; _b++) {
                    var t = _c[_b];
                    var local_res_2 = validateWhere(t, missing, c_list, ids);
                    if (local_res_2 != true)
                        return_list.push(local_res_2);
                }
                break;
            case 'GT':
                key_string = Object.keys(target[where_keys[k]]).toString();
                if (key_string != "" && !fs.existsSync("./data/" + key_string.split("_")[0] + ".dat")) {
                    if (missing.indexOf(key_string.split("_")[0]) < 0)
                        missing.push(key_string.split("_")[0]);
                    if (missing.length > 0)
                        return true;
                }
                if (typeof (target[where_keys[k]][key_string]) != "number" || clean_output_keys.indexOf(key_string.split("_")[1]) < 0)
                    return {
                        code: 400,
                        body: { "error": "Invalid GT" }
                    };
                else if (key_string == "rooms_number") {
                    return {
                        code: 400,
                        body: { "error": "Invalid GT" }
                    };
                }
                break;
            case 'LT':
                key_string = Object.keys(target[where_keys[k]]).toString();
                if (key_string != "" && !fs.existsSync("./data/" + key_string.split("_")[0] + ".dat")) {
                    if (missing.indexOf(key_string.split("_")[0]) < 0)
                        missing.push(key_string.split("_")[0]);
                    if (missing.length > 0)
                        return true;
                }
                if (typeof (target[where_keys[k]][key_string]) != "number" || clean_output_keys.indexOf(key_string.split("_")[1]) < 0)
                    return {
                        code: 400,
                        body: { "error": "Invalid LT" }
                    };
                else if (key_string == "rooms_number") {
                    return {
                        code: 400,
                        body: { "error": "Invalid LT" }
                    };
                }
                break;
            case 'EQ':
                key_string = Object.keys(target[where_keys[k]]).toString();
                if (key_string != "" && !fs.existsSync("./data/" + key_string.split("_")[0] + ".dat")) {
                    if (missing.indexOf(key_string.split("_")[0]) < 0)
                        missing.push(key_string.split("_")[0]);
                    if (missing.length > 0)
                        return true;
                }
                if (typeof (target[where_keys[k]][key_string]) != "number" || clean_output_keys.indexOf(key_string.split("_")[1]) < 0)
                    return {
                        code: 400,
                        body: { "error": "Invalid EQ" }
                    };
                else if (key_string == "rooms_number") {
                    return {
                        code: 400,
                        body: { "error": "Invalid EQ" }
                    };
                }
                break;
            case 'IS':
                key_string = Object.keys(target[where_keys[k]]).toString();
                if (key_string != "" && !fs.existsSync("./data/" + key_string.split("_")[0] + ".dat")) {
                    if (missing.indexOf(key_string.split("_")[0]) < 0)
                        missing.push(key_string.split("_")[0]);
                    if (missing.length > 0)
                        return true;
                }
                if (typeof (target[where_keys[k]][key_string]) != "string" || clean_output_keys.indexOf(key_string.split("_")[1]) < 0)
                    return {
                        code: 400,
                        body: { "error": "Invalid IS" }
                    };
                break;
            case 'NOT':
                if (Object.keys(target[where_keys[k]]).length != 1)
                    return { code: 400, body: { "error": "NOT should have only one filter" } };
                var local_res = validateWhere(target[where_keys[k]], missing, c_list, ids);
                if (local_res != true)
                    return local_res;
                break;
            default:
                return { code: 400, body: { "error": "Invalid query" } };
        }
    }
    if (return_list.length < 1)
        return true;
    else
        return return_list[0];
}
function validateTransformation(target, groupBy, applyBy, ids) {
    var apply_obj_names = [];
    var keys = Object.keys(target);
    if (keys.length < 2 || keys.indexOf("GROUP") < 0 || keys.indexOf("APPLY") < 0)
        return { code: 400, body: { "error": "Invalid query: TRANSFORMATIONS" } };
    else {
        var group = target.GROUP;
        if (group.length <= 0)
            return { code: 400, body: { "error": "Invalid query: GROUP cannot be empty" } };
        else {
            for (var _i = 0, group_1 = group; _i < group_1.length; _i++) {
                var s = group_1[_i];
                groupBy.push(s);
            }
        }
        var apply = target.APPLY;
        for (var _a = 0, apply_2 = apply; _a < apply_2.length; _a++) {
            var o = apply_2[_a];
            var o_key = Object.keys(o);
            for (var _b = 0, o_key_1 = o_key; _b < o_key_1.length; _b++) {
                var k = o_key_1[_b];
                if (apply_obj_names.indexOf(k) < 0)
                    apply_obj_names.push(k);
                else
                    return { code: 400, body: { "error": "Invalid query: APPLY objects should be unique" } };
                if (k.indexOf("_") >= 0)
                    return { code: 400, body: { "error": "Invalid query: APPLY key cannot have _ " } };
            }
            if (o_key.length > 1 || o_key.length === 0)
                return { code: 400, body: { "error": "Invalid query: APPLY structure invalid" } };
            else {
                var obj = o[o_key[0]];
                var obj_key = Object.keys(obj);
                var app_tokens = [
                    'MAX',
                    'MIN',
                    'AVG',
                    'SUM',
                    'COUNT'
                ];
                if (app_tokens.indexOf(obj_key[0]) < 0)
                    return { code: 400, body: { "error": "Invalid query: Apply token not recognized" } };
                if (obj_key[0] === "MAX" || obj_key[0] === "MIN" || obj_key[0] === "AVG" || obj_key[0] === "SUM") {
                    var numeric = [];
                    if (ids[0] === "courses") {
                        numeric =
                            [
                                'courses_avg',
                                'courses_pass',
                                'courses_fail',
                                'courses_audit',
                                'courses_year'
                            ];
                        if (numeric.indexOf(obj[obj_key[0]]) < 0)
                            return { code: 400, body: { "error": "Invalid query: Operator only supports numeric value" } };
                    }
                    else if (ids[0] === "rooms") {
                        numeric =
                            [
                                'rooms_lat',
                                'rooms_lon',
                                'rooms_seats',
                            ];
                        if (numeric.indexOf(obj[obj_key[0]]) < 0)
                            return { code: 400, body: { "error": "Invalid query: Operator only supports numeric value" } };
                    }
                }
                applyBy.push(o);
            }
        }
    }
    return true;
}
//# sourceMappingURL=InsightFacade.js.map