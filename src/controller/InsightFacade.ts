import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import Log from "../Util";
import {isUndefined} from "util";
let JSZip = require("jszip");
let fs = require("fs");
const parse5 = require('parse5');
const http = require('http');
const request = require('request');
export default class InsightFacade implements IInsightFacade {
    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise<InsightResponse>(function (resolve, reject) {
            let zip = new JSZip();
            zip.loadAsync(content, {base64: true}).then(function (data: any) {
                if(id == "courses")
                {
                    let proList: Promise<string>[] = [];
                    let keys = Object.keys(data);
                    let objkeys = Object.keys(data[keys[0]]);
                    let processed_results: any = [];
                    for (let i = 1; i < objkeys.length; i++) {
                        let file = zip.file(objkeys[i]);
                        if (file) {
                            proList.push(file.async("string"));
                        }
                    }

                    Promise.all(proList).then(strings => {
                        for (let i = 1; i < objkeys.length; i++) {
                            if (strings[i - 1].charAt(0) == "\"")
                                return reject({code: 400, body: {'error': "Could not parse JSON"}});
                            let temp = JSON.parse(strings[i - 1]);
                            let temp_keys = Object.keys(temp);
                            if (temp_keys.indexOf('result') < 0 || temp['result'] === undefined)
                                return reject({code: 400, body: {'error': "Invalid data inside zip file"}});
                            let results = temp['result'];
                            let clean_input_keys =
                                [
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
                            let clean_output_keys =
                                [
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

                            for (let r of results) {
                                let newo: any = {};
                                for (let i: number = 0; i < clean_input_keys.length; i++) {
                                    if(clean_input_keys[i] === "Year" && r['Section'] === "overall")
                                        newo[clean_output_keys[i]] = 1900;
                                    else if(clean_input_keys[i] === "Year" && r['Section'] !== "overall")
                                        newo[clean_output_keys[i]] = +r[clean_input_keys[i]];
                                    else if(clean_input_keys[i] === "id")
                                        newo[clean_output_keys[i]] = r[clean_input_keys[i]].toString();
                                    else
                                        newo[clean_output_keys[i]] = r[clean_input_keys[i]];
                                }
                                processed_results.push(newo);
                            }

                        }
                        if (processed_results.length === 0)
                            return reject({code: 400, body: {'error': "Nothing to write"}});
                        if (fs.existsSync("./data")) {
                            if (fs.existsSync("./data/" + id + ".dat")) {
                                console.log("rewriting...");
                                fs.writeFileSync("./data/" + id + ".dat", JSON.stringify(processed_results));
                                return resolve({code: 201, body: {}});
                            }
                            else {
                                let path: string = "./data/" + id + ".dat";
                                fs.writeFileSync(path, JSON.stringify(processed_results));
                                return resolve({code: 204, body: {}});
                            }
                        }
                        else {
                            fs.mkdirSync("./data");
                            let path: string = "./data/" + id + ".dat";
                            fs.writeFileSync(path, JSON.stringify(processed_results));
                            return resolve({code: 204, body: {}});
                        }
                    }).catch(function (err) {
                        return reject({code: 400, body: {"error": err.toString()}});
                    });
                }
                else
                {
                    let proList: Promise<string>[] = [];
                    let keys = Object.keys(data);
                    let objkeys = Object.keys(data[keys[0]]);
                    let rooms:any[] = [];
                    let building_list:any[] = [];
                    zip.file("index.htm").async("string").then(function (data:any){
                        let parsed = parse5.parse(data);
                        index_tree_helper(parsed, building_list);
                        for (let i = 1; i < objkeys.length; i++)
                        {
                            let file = zip.file(objkeys[i]);
                            if(file && building_list.indexOf(objkeys[i].split("campus/discover/buildings-and-classrooms/")[1])>-1)
                            {
                                proList.push(file.async("string"));
                            }
                        }
                        Promise.all(proList).then(strings =>
                        {

                            for(let s of strings)
                            {
                                let buildingInfo:string[] = [];
                                let rooms_shortnames: string[] = [];
                                let rooms_numbers: string[] = [];
                                let rooms_names: string[] = [];
                                let rooms_seats: number[] = [];
                                let rooms_types: string[]= [];
                                let rooms_furnitures: string[] = [];
                                let rooms_hrefs: string[] = [];
                                let tree = parse5.parse(s);
                                building_tree_helper(tree,buildingInfo,rooms_shortnames,
                                    rooms_numbers,rooms_names,rooms_seats,rooms_types,rooms_furnitures,rooms_hrefs);
                                if(rooms_shortnames.length !== 0)
                                {
                                    for(let i:number=0; i<rooms_shortnames.length; i++)
                                    {
                                        let room = {
                                            rooms_fullname: buildingInfo[0],
                                            rooms_shortname: rooms_shortnames[i],
                                            rooms_number: rooms_numbers[i],
                                            rooms_name: rooms_names[i],
                                            rooms_address: buildingInfo[1],
                                            rooms_lat:0,
                                            rooms_lon:0,
                                            rooms_seats: rooms_seats[i],
                                            rooms_type: rooms_types[i],
                                            rooms_furniture: rooms_furnitures[i],
                                            rooms_href: rooms_hrefs[i]
                                        };
                                        rooms.push(room);
                                    }
                                }

                            }
                            let geo_proList:Promise<Object>[] = [];
                            for(let rm of rooms)
                            {
                                geo_proList.push(geo_helper(rm));

                            }
                            Promise.all(geo_proList).then(values=>{

                                let parsed = JSON.parse(JSON.stringify(values));
                                for(let i:number=0; i<parsed.length; i++)
                                {
                                    let parsed_p = JSON.parse(parsed[i]);
                                    rooms[i].rooms_lat = +parsed_p.lat;
                                    rooms[i].rooms_lon = +parsed_p.lon;

                                }

                                if (rooms.length === 0)
                                    return reject({code: 400, body: {'error': "Nothing to write"}});
                                if (fs.existsSync("./data")) {
                                    if (fs.existsSync("./data/" + id + ".dat")) {
                                        console.log("rewriting...");
                                        fs.writeFileSync("./data/" + id + ".dat", JSON.stringify(rooms));
                                        return resolve({code: 201, body: {}});
                                    }
                                    else {
                                        let path: string = "./data/" + id + ".dat";
                                        fs.writeFileSync(path, JSON.stringify(rooms));
                                        return resolve({code: 204, body: {}});
                                    }
                                }
                                else {
                                    fs.mkdirSync("./data");
                                    let path: string = "./data/" + id + ".dat";
                                    fs.writeFileSync(path, JSON.stringify(rooms));
                                    return resolve({code: 204, body: {}});
                                }
                            });


                        }).catch(function (err) {
                            return reject({code: 400, body: {"error": err.toString()}});
                        });

                    }).catch(function (err: any){
                        return reject({code: 400, body: {"error": err.toString()}});
                    });
                }

            }).catch(function (err: any) {
                return reject({code: 400, body: {"error": err.toString()}});
            });
        });
    }


    removeDataset(id: string): Promise<InsightResponse> {
        return new Promise<InsightResponse>(function (resolve, reject) {
            let path: string = "./data/" + id + ".dat";
            if (!fs.existsSync("./data") || !fs.existsSync(path)) {
                reject({code: 404, body: {}});
            }
            else {
                fs.unlinkSync(path);
                resolve({code: 204, body: {}});
            }
        });

    }

    performQuery(query: QueryRequest): Promise<InsightResponse> {


        return new Promise<InsightResponse>(function (resolve, reject) {
            let query_keys = Object.keys(query);
            //validate query
            if (query_keys.length < 2) {
                return reject({code: 400, body: {"error": "Invalid query: missing where or options 1"}});
            }
            else if (query_keys.indexOf("WHERE") < 0 || query_keys.indexOf("OPTIONS") < 0) {
                return reject({code: 400, body: {"error": "Invalid query: missing where or options 2"}});
            }
            let missing: string[] = [];
            let c_list: string[] = [];
            let ids: string[] = [];
            let response1 = validateOptions(JSON.parse(JSON.stringify(query))["OPTIONS"], missing, c_list, ids);
            let groupByRes:string[] = [];
            let applyBy:any[] = [];
            if(JSON.parse(JSON.stringify(query))["TRANSFORMATIONS"])
            {
                let target = JSON.parse(JSON.stringify(query))["TRANSFORMATIONS"];
                let response3 = validateTransformation(target,groupByRes,applyBy,ids);
                let apply_keys:string[] = [];
                if(response3 !== true)
                {
                    return reject(response3);
                }
                for(let ap of applyBy)
                {
                    let k = Object.keys(ap);
                    let val = k[0];
                    apply_keys.push(val);
                }
                for(let g of groupByRes)
                {
                    if(apply_keys.indexOf(g)>=0)
                        return reject({code: 400, body: {"error": "Invalid query: GROUP cannot have apply key"}});
                    else if(g.split("_").length === 2 && ids.indexOf(g.split("_")[0])<0)
                        return reject({code: 400, body: {"error": "Invalid query: Cannot perform on 2 sets"}});
                }
                for(let c of c_list)
                {
                    if(groupByRes.indexOf(c)<0 && apply_keys.indexOf(c)<0)
                        return reject({code: 400, body: {"error": "Invalid query: All columns should be in group or apply"}});
                }
            }
            //console.log("passed transformation test");
            if (response1 !== null) {
                return reject(response1);
            }
            else if (missing.length > 0) {
                return reject({code: 424, body: {"missing":missing}});
            }
            else {
                //console.log("passed option test");
                let response2 = validateWhere(JSON.parse(JSON.stringify(query))["WHERE"], missing, c_list, ids);
                if (missing.length > 0) {
                    return reject({code: 424, body: missing});
                }
                else if (response2 !== true) {
                    return reject(response2);
                }
            }

//dui
            let where: any = JSON.parse(JSON.stringify(query))["WHERE"];
            let json:any;
            if(ids.length > 0)
            {
                if(fs.readFileSync("./data/"+ ids[0] + ".dat"))
                    json = fs.readFileSync("./data/"+ ids[0] + ".dat").toString();
            }

            let jonj = JSON.parse(json);
            var filtered_data: any;
            if(Object.keys(where).length === 0) {
                filtered_data=jonj;
            }
            else {
                var keys: any = Object.keys(where)[0];
                var filter: any = where[keys];
                filtered_data = helper(keys, filter, jonj);
            }



            var final_result:any;

            if(Object.keys(groupByRes).length === 0){
                final_result=filtered_data;
            }
            else{
                var groupData:any;
                groupData = groupBy_helper(filtered_data, groupByRes);
                var apply_result:any;
                if(Object.keys(applyBy).length === 0) {
                    let key3 = Object.keys(groupData);
                    apply_result = JSON.parse(JSON.stringify(key3));

                    for (var i = 0; i < apply_result.length; i++) {
                        let temp=JSON.parse(apply_result[i]);
                        apply_result[i]=temp;
                    }
                }
                else {
                    apply_result=apply_helper(groupData,applyBy);

                }
                final_result=apply_result;
            }

            let column: any = JSON.parse(JSON.stringify(query))["OPTIONS"]["COLUMNS"];
            let retData: any[] = [];

            for (let v of final_result) {

                let newEntry: any = {};
                column.forEach(function (k: any) {
                    return newEntry[k] = v.hasOwnProperty(k) ? v[k] : null;
                });
                retData.push(newEntry);
            }

            if (!isUndefined(JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"])) {
                if (!isUndefined(JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"]["dir"])) {
                    let dir=JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"]["dir"];
                    let order=JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"]["keys"]
                    if(dir=="UP"){
                        retData.sort(function (a: any, b: any) {
                            return sortingup(a,b,order);
                        });

                    }
                    else{
                            retData.sort(function (a: any, b: any) {
                                return sortingdown(a,b,order);
                            });
                    }
                }
                else{

                    let order: any = JSON.parse(JSON.stringify(query))["OPTIONS"]["ORDER"];
                    retData.sort(function (a: any, b: any) {
                        if (a[order] > b[order]){
                            return 1;
                        }
                        else if(a[order] < b[order]){
                            return -1;
                        }
                        else
                            return 0;
                    });
                }
            }

            let re = {
                render: 'TABLE',
                result: retData
            };

            return resolve({code: 200, body: re});
        });
    }
}

function sortingup(a:any,b:any,order:any){

    for(var i=0 ; i<order.length;i++) {
        if ((a[order[i]] > b[order[i]])) {
            return 1;
        }
        else if ((a[order[i]] == b[order[i]])) {
            if(i!=order.length-1) {
                continue;
            }
            else{
                return 0;
            }
        }
        else {
            return -1;

        }

    }

}

function sortingdown(a:any,b:any,order:any){

    for(var i=0 ; i<order.length;i++) {
        if ((a[order[i]] < b[order[i]])) {
            return 1;
        }
        else if ((a[order[i]] == b[order[i]])) {
            if(i!=order.length-1) {
                continue;
            }
            else{
                return 0;
            }
        }
        else {
            return -1;

        }

    }

}

function apply_helper(data:any,apply:any){

    let key3 = Object.keys(data);
    var apply_result = JSON.parse(JSON.stringify(key3));

    for (var i = 0; i < apply_result.length; i++) {
        let temp=JSON.parse(apply_result[i]);
        apply_result[i]=temp;
    }

    for(let a of apply){

        let keys = Object.keys(a);
        var b = keys[0];
        var k = a[b];
        let key2 = Object.keys(k);
        var b2 = key2[0];
        var k2 = k[b2];
        let result:any=[];
        switch (b2) {
            case "MAX":

                for(let e of key3){
                    let comparearray:any=[];
                    let v=data[e];
                    for (let vv of data[e]){
                        comparearray.push(vv[k2]);
                    }
                    let max=Math.max.apply(null,comparearray);
                    let ret:any={};
                    ret[b]=max;
                    let newkey=JSON.stringify(ret);
                    result.push(JSON.parse(newkey));
                }
                break;
            case "MIN":

                for(let e of key3){
                    let comparearray:any=[];
                    for (let vv of data[e]){
                        comparearray.push(vv[k2]);
                    }
                    let min=Math.min.apply(null,comparearray);
                    let ret:any={};
                    ret[b]=min;
                    let newkey=JSON.stringify(ret);
                    result.push(JSON.parse(newkey));

                }
                break;

            case "AVG":

                for(let e of key3) {

                    let comparearray: number[] = [];
                    let v = data[e];

                    for (let vv of data[e]) {
                        comparearray.push(vv[k2]);
                    }
                    for (let i:number=0; i < comparearray.length; i++) {
                        comparearray[i] *= 10;
                        comparearray[i] = Number(comparearray[i].toFixed(0))
                    }
                    let sum:number=0;
                    for (let k of comparearray){
                        sum=sum+k;
                    }

                    let avg:number = sum / (comparearray.length);

                    avg=avg/10;
                    let res:number = Number(avg.toFixed(2));
                    let ret:any={};
                    ret[b]=res;
                    let newkey=JSON.stringify(ret);

                    result.push(JSON.parse(newkey));

                }
                break;

            case "COUNT":

                for(let e of key3){

                    let v=data[e];
                    var store:any=[];
                    let cont:number=0;

                    for (let vv of data[e]){
                        if (store.indexOf(vv[k2])==-1) {
                            cont++;
                            store.push(vv[k2]);
                        }
                    }

                    let ret:any={};
                    ret[b]=cont;
                    let newkey=JSON.stringify(ret);
                    result.push(JSON.parse(newkey));

                }
                break;

            case "SUM":

                for(let e of key3){

                    let comparearray:any=[];
                    let v=data[e];
                    for (let vv of data[e]){
                        comparearray.push(vv[k2]);
                    }
                    var sum = comparearray.reduce((a:any, b:any) => a + b, 0);
                    let ret:any={};
                    ret[b]=sum;
                    let newkey=JSON.stringify(ret);
                    result.push(JSON.parse(newkey));
                }
                break;

        }

        for (var i = 0; i < apply_result.length; i++) {
            var result2 = Object.assign({},apply_result[i], result[i]);
            apply_result[i]=result2;
        }

    }
    return apply_result;


}


function geo_helper(room:any)
{
    return new Promise(function (resolve, reject){
        let uri = encodeURIComponent(room.rooms_address);
        let url = "http://skaha.cs.ubc.ca:11316/api/v1/team185/"+uri;
        request(url, function(err:any, res:any, body:any){
            if(!err && res.statusCode === 200)
                return resolve(body);
            else
                return reject(err);
        });
    });
}
function index_tree_helper(node: any, list: any)
{
    let nodeKeys = Object.keys(node);
    if(nodeKeys.indexOf('attrs')>-1)
    {
        let attrs = node.attrs;
        for(let at of attrs)
        {
            if(at.name == 'class'&&at.value == 'views-field views-field-field-building-code')
            {
                list.push(node.childNodes[0].value.split('\n')[1].replace(/ /g,''));
            }
        }
    }
    if(nodeKeys.indexOf('childNodes')>-1)
    {
        let children = node.childNodes;
        for(let child of children)
        {
            index_tree_helper(child,list);
        }
    }
    //return true;
}

function building_tree_helper(node:any,buildingInfo:any,rooms_shortnames:any,
                              rooms_numbers:any,rooms_names:any,rooms_seats:any,rooms_types:any,rooms_furnitures:any,rooms_hrefs:any)
{
    let key_list = [
        "views-field views-field-field-room-number",
        "views-field views-field-field-room-capacity",
        "views-field views-field-field-room-furniture",
        "views-field views-field-field-room-type",
    ];
    let nodeKeys = Object.keys(node);
    if(nodeKeys.indexOf('attrs')>-1)
    {
        let attrs = node.attrs;
        for (let at of attrs)
        {

            let shortname: string;
            let href: string;
            let number: string;
            let room_name: string;
            let seats: number;
            let type: string;
            let furniture: string;

            if (at.name === "class")
            {
                switch (at.value) {
                    case key_list[0]:
                        if (typeof node.childNodes !== 'undefined') {
                            for (let kid of node.childNodes) {
                                if (typeof kid.childNodes !== 'undefined' && kid.attrs.length != 0) {
                                    for (let att of kid.attrs) {
                                        if (att.name == "href")
                                            href = att.value;
                                    }
                                    room_name = href.split("/room/")[1].replace("-","_");
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
                        let target_node = node.childNodes[0];
                        if (typeof target_node !== 'undefined' && typeof target_node.value !== 'undefined')
                            if(target_node.value.indexOf('Building Hours')<0)
                                buildingInfo.push(target_node.value);
                        break;
                }
            }

        }
    }
    if(nodeKeys.indexOf('childNodes')>-1)
    {
        let children = node.childNodes;
        for(let child of children)
        {
            building_tree_helper(child,buildingInfo,rooms_shortnames,
                rooms_numbers,rooms_names,rooms_seats,rooms_types,rooms_furnitures,rooms_hrefs);
        }
    }
    //return true;
}

function intersect(a:any,b:any) {
    if (a.length == 0) {
        return a;
    }
    let re:any[] = [];
    let actualTags = a.map(function (obj: any) {
        return (+obj.courses_uuid||obj.rooms_name);
    });
    //return actualTags;
    //infinite loop here
    for (let bb of b) {

        if ((actualTags.indexOf(+bb.courses_uuid) >= 0)||(actualTags.indexOf(bb.rooms_name) >= 0)) {
            re.push(bb);

        }

    }
    return re;
}

function union(a: any, b: any) {
    if (a.length == 0) {
        return b;
    }
    var re:any[] = [];
    var actualTags = a.map(function (obj: any) {
        return (+obj.courses_uuid||obj.rooms_name);
    });

    var b_after = b.filter(function(bb:any) {
        return ((actualTags.indexOf(+bb.courses_uuid) < 0)&&(actualTags.indexOf(bb.rooms_name) < 0)); // if truthy then keep item
    });
    re = b_after.concat(a);
    return re;
}

function groupBy_helper(list:any, gp:any) {
    var groups:any = {};
    for (var i = 0; i < list.length; i++) {
        let newEntry: any = {};
        gp.forEach(function (k: any) {
            return newEntry[k] = list[i].hasOwnProperty(k) ? list[i][k] : null;
        });
        let group = JSON.stringify(newEntry);
        if (group in groups) {
            groups[group].push(list[i]);
        } else {
            groups[group] = [list[i]];
        }
    }
    return groups;
}

function helper(key: string, filter: any, coursedata: any[]) {
    switch (key) {
        case "AND":
            var results:any[] = [];
            for (var k of filter) {
                let keys = Object.keys(k);
                var a = keys[0];
                var b = k[a];
                var result = helper(a, b, coursedata);
                results.push(result);
            }
            var last: any = [];

            if(results.length>=1){
                last=results[0];
            }


            for (var r of results) {
                if (results.indexOf(r)==0){
                    continue;
                }
                last = intersect(last, r);
            }
            return last;


        case "OR":
            var results = [];
            for (var k of filter) {
                let keys = Object.keys(k);
                var a = keys[0];
                var b = k[a];
                var result = helper(a, b, coursedata);
                results.push(result);
            }
            var last: any = [];
            for (var r of results) {
                last = union(last, r);
            }
            return last;

        case "NOT":
            var a = Object.keys(filter)[0];
            var b = filter[a];
            var result = helper(a, b, coursedata);

            var courses: any[] = [];
            var numbers: any[] = [];

            for (let n of result) {
                numbers.push(+n['courses_uuid']||n['rooms_name']);
            }
            for(let v of coursedata){
                if((numbers.indexOf(+v['courses_uuid']) < 0)&&(numbers.indexOf(v['rooms_name']) < 0)){
                    courses.push(v);
                }
            }

            return courses;

        case "EQ":
            var query_keys = Object.keys(filter)[0];
            var query_number = filter[query_keys];
            var courses: any[] = [];
            for (let v of coursedata) {
                if (v[query_keys] == query_number) {
                    courses.push(v);
                }
            }
            return courses;
        case "GT":
            var query_keys = Object.keys(filter)[0];
            var query_number = filter[query_keys];
            var courses: any[] = [];//coursedata.filter(elem => (elem as any)[query_keys] > query_number);
            for (let v of coursedata) {
                if (v[query_keys] > query_number) {
                    courses.push(v);
                }
            }

            return courses;
        case "LT":
            var query_keys = Object.keys(filter)[0];
            var query_number = filter[query_keys];
            var courses: any[] = [];//coursedata.filter(elem => (elem as any)[query_keys] > query_number);
            for (let v of coursedata) {
                if (v[query_keys] < query_number) {
                    courses.push(v);
                }
            }

            return courses;
        case "IS":
            var query_keys = Object.keys(filter)[0];
            var query_number = filter[query_keys];
            var courses: any[] = [];
            for (let v of coursedata) {
                if (query_number.indexOf("*") == 0 && query_number.length > 1) {
                    if (query_number.indexOf("*", 1) == query_number.length - 1) {
                        if (v[query_keys].toString().includes(query_number.substring(1, query_number.length - 1))) {
                            courses.push(v);
                        }
                    } else {
                        if (v[query_keys].toString().endsWith(query_number.substring(1))) {
                            courses.push(v);
                        }
                    }
                } else if (query_number.indexOf("*") == query_number.length - 1 && query_number.length > 1) {
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


function validateOptions(options: any, missing: string[], c_list: string[], ids: string[]) {
    let opt_keys = Object.keys(options);
    if (opt_keys.length < 2)
        return {code: 400, body: {"error": "Invalid query by options length"}};
    else if (opt_keys.indexOf("COLUMNS") < 0 || opt_keys.indexOf("FORM") < 0)
        return {code: 400, body: {"error": "Invalid query by option type"}};
    else {
        let columns = options["COLUMNS"];
        let order = options["ORDER"];
        let form = options["FORM"];
        if (form == null || form != "TABLE")
            return {code: 400, body: {"error": "Invalid query: FORM"}};
        for (let c of columns) {

            let slices = c.split("_");
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
        if(ids.length === 1 && ids[0] === "courses") {
            if(!fs.existsSync("./data/" + ids[0] + ".dat"))
                if (missing.indexOf(ids[0]) < 0)
                    missing.push(ids[0]);
        }
        else if(ids.length === 1 && ids[0] === "rooms") {
            if(!fs.existsSync("./data/" + ids[0] + ".dat"))
                if (missing.indexOf(ids[0]) < 0)
                    missing.push(ids[0]);
        }
        else if(ids.length > 1 && missing.length < 1)
        {
            return {code: 400, body: {"error": "Invalid query: Too many data sets"}};
        }

        if (order != null && typeof order === "string") {
            if (c_list.indexOf(order) < 0) {
                return {code: 400, body: {"error": "Invalid query: ORDER"}};
            }
        }
        else if(order != null && typeof order === "object")
        {
            let orderKeys = Object.keys(order);
            if(orderKeys.length !== 2 || orderKeys.indexOf("dir")<0 || orderKeys.indexOf("keys")<0)
                return {code: 400, body: {"error": "Invalid query: ORDER format"}};
            let dir = order["dir"];
            let keys = order["keys"];
            if(dir !== "UP" && dir !== "DOWN")
                return {code: 400, body: {"error": "Invalid query: dir value invalid"}};
            if(keys.length === 0)
                return {code: 400, body: {"error": "Invalid query: keys cannot be empty"}};
            else{
                for(let val of keys)
                {
                    if(c_list.indexOf(val)<0)
                        return {code: 400, body: {"error": "Invalid query: order keys need to be in columns"}};
                }
            }
        }

        let clean_output_keys:string[] = [];
        if(ids.length === 1 && ids[0] === "courses") {
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
        else if(ids.length === 1 && ids[0] === "rooms")
        {
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
            if(!fs.existsSync("./data/" + ids[0] + ".dat"))
                if (missing.indexOf(ids[0]) < 0)
                    missing.push(ids[0]);
        }
        else if(ids.length > 1 && missing.length < 1)
        {
            return {code: 400, body: {"error": "Invalid query: Too much data sets"}};
        }

        if (c_list.length <= 0)
            return {code: 400, body: {"error": "Invalid query: COLUMNS"}};
        else{
            for(let c of c_list)
            {
                if(c.split("_").length === 2 && clean_output_keys.indexOf(c.split("_")[1])<0)
                    return {code: 400, body: {"error": "Invalid query: COLUMNS"}};
            }
        }

        return null;
    }
}

function validateWhere(target: any, missing: string[], c_list: string[], ids:string[]): any {
    let where_keys = Object.keys(target);
    if(where_keys.length === 0)
        return true;
    let return_list:any[] = [];
    let clean_output_keys:string[] = [];
    if(ids.length === 1 && ids[0] === "courses") {
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
    else if(ids.length === 1 && ids[0] === "rooms")
    {
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
        if(!fs.existsSync("./data/" + ids[0] + ".dat"))
            if (missing.indexOf(ids[0]) < 0)
                missing.push(ids[0]);
    }
    else if(ids.length > 1 && missing.length < 1)
    {
        return {code: 400, body: {"error": "Invalid query: Too much data sets"}};
    }

    for (let k in where_keys)
    {
        let key_string:string;
        switch (where_keys[k])
        {
            case 'AND':
                if(target[where_keys[k]].length<1)
                    return {code:400, body:{"error": "AND should have at least one filter"}};
                for(let t of target[where_keys[k]])
                {
                    let local_res = validateWhere(t, missing, c_list, ids);
                    if(local_res != true)
                        return_list.push(local_res);
                }
                break;
            case 'OR':
                if(target[where_keys[k]].length<1)
                    return {code:400, body:{"error": "OR should have at least one filter"}};
                for(let t of target[where_keys[k]])
                {
                    let local_res = validateWhere(t, missing, c_list, ids);
                    if(local_res != true)
                        return_list.push(local_res);
                }
                break;
            case 'GT':
                key_string = Object.keys(target[where_keys[k]]).toString();
                if (key_string!= "" && !fs.existsSync("./data/" + key_string.split("_")[0] + ".dat"))
                {
                    if(missing.indexOf(key_string.split("_")[0])<0)
                        missing.push(key_string.split("_")[0]);
                    if(missing.length>0)
                        return true;
                }
                if(typeof(target[where_keys[k]][key_string])!="number" || clean_output_keys.indexOf(key_string.split("_")[1])<0)
                    return {
                        code: 400,
                        body: {"error": "Invalid GT"}
                    };
                else if(key_string == "rooms_number")
                {
                    return {
                        code: 400,
                        body: {"error": "Invalid GT"}
                    };
                }

                break;
            case 'LT':
                key_string = Object.keys(target[where_keys[k]]).toString();
                if (key_string!= "" && !fs.existsSync("./data/" + key_string.split("_")[0] + ".dat"))
                {
                    if(missing.indexOf(key_string.split("_")[0])<0)
                        missing.push(key_string.split("_")[0]);
                    if(missing.length>0)
                        return true;
                }
                if(typeof(target[where_keys[k]][key_string])!="number" || clean_output_keys.indexOf(key_string.split("_")[1])<0)
                    return {
                        code: 400,
                        body: {"error": "Invalid LT"}
                    };
                else if(key_string == "rooms_number")
                {
                    return {
                        code: 400,
                        body: {"error": "Invalid LT"}
                    };
                }
                break;
            case 'EQ':
                key_string = Object.keys(target[where_keys[k]]).toString();
                if (key_string!= "" && !fs.existsSync("./data/" + key_string.split("_")[0] + ".dat"))
                {
                    if(missing.indexOf(key_string.split("_")[0])<0)
                        missing.push(key_string.split("_")[0]);
                    if(missing.length>0)
                        return true;
                }
                if(typeof(target[where_keys[k]][key_string])!="number" || clean_output_keys.indexOf(key_string.split("_")[1])<0)
                    return {
                        code: 400,
                        body: {"error": "Invalid EQ"}
                    };
                else if(key_string == "rooms_number")
                {
                    return {
                        code: 400,
                        body: {"error": "Invalid EQ"}
                    };
                }
                break;
            case 'IS':
                key_string = Object.keys(target[where_keys[k]]).toString();
                if (key_string!= "" && !fs.existsSync("./data/" + key_string.split("_")[0] + ".dat"))
                {
                    if(missing.indexOf(key_string.split("_")[0])<0)
                        missing.push(key_string.split("_")[0]);
                    if(missing.length>0)
                        return true;
                }
                if(typeof(target[where_keys[k]][key_string])!="string" || clean_output_keys.indexOf(key_string.split("_")[1])<0)
                    return {
                        code: 400,
                        body: {"error": "Invalid IS"}
                    };
                break;
            case 'NOT':
                if(Object.keys(target[where_keys[k]]).length!=1)
                    return {code:400, body:{"error": "NOT should have only one filter"}};
                let local_res = validateWhere(target[where_keys[k]], missing, c_list, ids);
                if(local_res != true)
                    return local_res;
                break;
            default:
                return {code:400, body:{"error": "Invalid query"}};

        }
    }
    if(return_list.length<1)
        return true;
    else
        return return_list[0];
}


function validateTransformation(target:any, groupBy: string[], applyBy: any[],ids: string[])
{
    let apply_obj_names:string[] = [];
    let keys = Object.keys(target);
    if(keys.length < 2 || keys.indexOf("GROUP") < 0 || keys.indexOf("APPLY") < 0)
        return {code: 400, body: {"error": "Invalid query: TRANSFORMATIONS"}};
    else
    {
        let group = target.GROUP;
        if(group.length <= 0)
            return {code: 400, body: {"error": "Invalid query: GROUP cannot be empty"}};
        else
        {
            for(let s of group)
            {
                groupBy.push(s);
            }

        }
        let apply = target.APPLY;
        for(let o of apply)
        {
            let o_key = Object.keys(o);
            for(let k of o_key)
            {
                if(apply_obj_names.indexOf(k) < 0)
                    apply_obj_names.push(k);
                else
                    return {code: 400, body: {"error": "Invalid query: APPLY objects should be unique"}};
                if(k.indexOf("_")>=0)
                    return {code: 400, body: {"error": "Invalid query: APPLY key cannot have _ "}};
            }
            if(o_key.length > 1 || o_key.length === 0)
                return {code: 400, body: {"error": "Invalid query: APPLY structure invalid"}};
            else
            {
                let obj = o[o_key[0]];
                let obj_key = Object.keys(obj);
                let app_tokens:string[] =
                    [
                        'MAX',
                        'MIN',
                        'AVG',
                        'SUM',
                        'COUNT'
                    ];
                if(app_tokens.indexOf(obj_key[0])<0)
                    return {code: 400, body: {"error": "Invalid query: Apply token not recognized"}};
                if(obj_key[0] === "MAX"||obj_key[0] === "MIN"||obj_key[0] === "AVG"||obj_key[0] === "SUM")
                {
                    let numeric:string[] = [];
                    if(ids[0] === "courses")
                    {
                        numeric =
                            [
                                'courses_avg',
                                'courses_pass',
                                'courses_fail',
                                'courses_audit',
                                'courses_year'
                            ];
                        if(numeric.indexOf(obj[obj_key[0]]) < 0)
                            return {code: 400, body: {"error": "Invalid query: Operator only supports numeric value"}};
                    }
                    else if(ids[0] === "rooms")
                    {
                        numeric =
                            [
                                'rooms_lat',
                                'rooms_lon',
                                'rooms_seats',
                            ];
                        if(numeric.indexOf(obj[obj_key[0]]) < 0)
                            return {code: 400, body: {"error": "Invalid query: Operator only supports numeric value"}};
                    }
                }
                applyBy.push(o);
            }

        }

    }
    return true;

}