
/*import {expect} from 'chai';
import Server from "../src/rest/Server";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";
let fs = require("fs");

describe("InsightFacadeSpec", function () {

    let facade: InsightFacade = null;
    function sanityCheck(response: InsightResponse) {
        expect(response).to.have.property('code');
        expect(response).to.have.property('body');
        expect(response.code).to.be.a('number');
    }

    beforeEach(function () {
        facade = new InsightFacade();
    });

    afterEach(function () {
        facade = null;
    });
    it("Should be able to echo", function () {


        let out = Server.performEcho('echo');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: 'echo...echo'});
    });

    it("Should be able to echo silence", function () {
        let out = Server.performEcho('');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: '...'});
    });

    it("Should be able to handle a missing echo message sensibly", function () {
        let out = Server.performEcho(undefined);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it("Should be able to handle a null echo message sensibly", function () {
        let out = Server.performEcho(null);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.have.property('error');
        expect(out.body).to.deep.equal({error: 'Message not provided'});


    });



    it("Testing addDataset with new course id", function () {
        let data = fs.readFileSync("testData/courses.zip");
        return facade.addDataset("courses", data).then(function (value: InsightResponse) {

            expect(value.code).to.equal(204)
        }).catch(function (err) {
            Log.test('Error: ' + err);
            expect.fail();
        });
    });
    it("Testing addDataset with existing id", function () {
        let data = fs.readFileSync("testData/courses.zip");
        return facade.addDataset("courses", data).then(function (value: InsightResponse) {
            expect(value.code).to.equal(201)
        }).catch(function (err) {
            Log.test('Error: ' + err);
            expect.fail();
        });
    });
    it("Testing addDataset with null data", function () {
        let data = null;
        return facade.addDataset("invalid", data).then(function (value: InsightResponse) {
            expect(value.code).to.equal(400);
            console.log(value.code);
        }).catch(function (err: InsightResponse)
        {
            console.log(err.code);
        });
    });

    it("Testing addDataset with picture data", function () {
        let data = fs.readFileSync("testData/IMG_4436.jpg");
        return facade.addDataset("picture", data).then(function (value: InsightResponse) {
        expect(value.code).to.equal(400);
        console.log(value.code);
        }).catch(function (err: InsightResponse) {
            console.log(err.code);
        })
    });


    it("Testing addDataset with valid but useless data", function () {
      let data = fs.readFileSync("testData/New folder.zip");
      return facade.addDataset("courses", data).then(function (value: InsightResponse) {
      expect(value.code).to.equal(400);
      expect.fail();
      }).catch(function (err: InsightResponse) {
      expect(err.code).to.equal(400);
      });
    });

    it("Testing performQuery1", function () {
        return facade.performQuery({
            "WHERE":{
                "GT":{
                    "courses_avg":97
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
            console.log(value.body);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });


    it("Testing performQuery2", function () {
        return facade.performQuery({
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg":90
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ":{
                            "courses_avg":95
                        }
                    }
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });

    it("Testing performQuery3", function () {
        return facade.performQuery({
            "WHERE":{
                "OR": [
                    {"IS":{"courses_instructor": "desaulniers, shawn;leung, fok-shuen;sargent, pamela"}},
                    {"IS":{"courses_instructor": "sargent, pamela"}}
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_instructor",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }


        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });

    it("Testing performQuery4", function () {
        return facade.performQuery({
            "WHERE":{
                "AND":[
                    {"GT" : {"courses_avg":90}},
                    {"LT" : {"courses_avg":85}}
                ]

            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });

    it("Testing performQuery5", function () {
        return facade.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    },
                    {

                        "GT": {
                            "courses_avg": 94
                        }
                    }
                ]


            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": {"courses_uuid": "courses_avg"},
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });


    it("test 424 1 ", function () {
        return facade.performQuery({
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courss_avg": "90"
                    }
                }, {
                    "EQ": {
                        "courss_avg": 77
                    }

                }, {
                    "IS": {
                        "courses_dept": "cpsc"
                    }

                }

                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(424);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });


    it("Testing performQuery", function () {
        return facade.performQuery({
            "WHERE": {

                "OR": [
                    {
                        "NOT": {

                            "AND": [{
                                "GT": {
                                    "courses_avg": "90"
                                }
                            }, {
                                "EQ": {
                                    "courss_avg": "77"
                                }

                            }, {
                                "IS": {
                                    "course_dept": "cpsc"
                                }

                            }, {
                                "AND": [
                                    {
                                        "GT": {"courses_avg": 20}
                                    }
                                ]


                            }

                            ]


                        }
                    },
                    {
                        "IS": {
                            "courses_uuid": "129*"
                        }

                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(424);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });

    it("Testing performQuery10", function () {
        return facade.performQuery({
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courses_avg": 70
                    }
                }, {
                    "WE": {
                        "courses_dept": "cpsc"
                    }

                }, {
                    "LT": {
                        "courses_avg": 71
                    }

                }

                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
            console.log(err.body);
        });
    });
    it("Invalid key", function () {
        return facade.performQuery({
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courses_avg": "90"
                    }
                }, {
                    "EQ": {
                        "courss_avg": "77"
                    }

                }, {
                    "IS": {
                        "course_dept": "cpsc"
                    }

                }

                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(400);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });


    it("400 5", function () {
        return facade.performQuery({
            "WHERE":{
                "NOT":
                    {
                        "LT":{
                            "courses_avg":50
                        }
                    }

            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "stub_id",
                    "daddy_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(400);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });

    it("400 1", function () {
        return facade.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 63.99
                                }
                            }
                            , {
                                "EQ": {
                                    "courses_avg": 64
                                }
                            }
                        ]
                        ,
                        "IS": {
                            "courses_avg": 63.99
                        }
                    }
                    , {
                        "EQ": {
                            "courses_avg": 64
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_uuisd",
                    "courses_title",
                    "courses_insftructor",
                    "courses_fail",
                    "courses_ausddit",
                    "courses_pass"
                ],
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(400);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
            console.log(err.body);
        });
    });

    it("test set of instructor", function () {
        return facade.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "IS": {
                            "courses_instructor": "*hu, a*"
                        }
                    },
                    {
                        "IS": {
                            "cours_instructor": "*wolfman"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_uuid",
                    "courses_title",
                    "courses_instructor",
                    "courses_fail",
                    "courses_audit",
                    "courses_pass"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });

    it("test not", function () {
        return facade.performQuery({
            "WHERE": {
                "NOT": {

                    "IS": {"courses_dept": "*cpsc*"}
                }


            },
            "OPTIONS": {
                "COLUMNS": [

                    "courses_avg",
                    "courses_uuid",
                    "courses_dept",
                    "courses_instructor"

                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });

    it("bad query", function () {
        return facade.performQuery({
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courses1_avg": "90"
                    }
                }, {
                    "EQ": {
                        "courses2_avg": 77
                    }

                }, {
                    "IS": {
                        "course_dept": "cpsc"
                    }

                }

                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(400);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });

    it("200 2", function () {
        return facade.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "courses_dept": "*cpsc*"
                        }
                    }
                    ,
                    {
                        "NOT": {
                            "IS": {
                                "courses_uuid": "129*"
                            }
                        }

                    }

                ]


            },
            "OPTIONS": {
                "COLUMNS": [

                    "courses_uuid",
                    "courses_dept",
                    "courses_instructor"

                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });



    it("400 2", function () {
        return facade.performQuery({
            "WHERE": {
                "OR": [
                    {a: 5}

                ]
            }

            ,
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(400);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
        });
    });


    it("Testing removeDataset with existing id", function () {
        return facade.removeDataset("courses").then(function (value: InsightResponse) {
            expect(value.code).to.equal(204)
        }).catch(function (err) {
            Log.test('Error: ' + err);
            expect.fail();
        });
    });

    it("Testing removeDataset with new id", function () {
        return facade.removeDataset("courses").then(function (value: InsightResponse) {
            expect(value.code).to.equal(404);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code)
        });
    });

    it("Testing addDataset with new room id", function () {
        let data = fs.readFileSync("testData/rooms.zip");
        //console.log(data);
        return facade.addDataset("rooms", data).then(function (value: InsightResponse) {
            expect(value.code).to.equal(204)
        }).catch(function (err) {
            Log.test('Error: ' + err);
            expect.fail();
        });
    });
    it("Testing addDataset with new room id", function () {
        let data = fs.readFileSync("testData/rooms.zip");
        //console.log(data);
        return facade.addDataset("rooms", data).then(function (value: InsightResponse) {
            expect(value.code).to.equal(201)
        }).catch(function (err) {
            Log.test('Error: ' + err);
            expect.fail();
        });
    });

    it("Testing performQueryRoom1", function () {
        return facade.performQuery({
            "WHERE": {
                "IS": {
                    "rooms_name": "DMP_*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }

        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
            console.log(value.body);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
            console.log(err.body);
        });
    });

    it("Testing performQueryRoom2", function () {
        return facade.performQuery({
            "WHERE": {
                "IS": {
                    "rooms_address": "*Agrono*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "FORM": "TABLE"
            }
        }).then(function (value: InsightResponse) {
            expect(value.code).to.equal(200);
            console.log(value.code);
            console.log(value.body);
        }).catch(function (err:InsightResponse) {
            console.log(err.code);
            console.log(err.body);
        });
    });

    it("Testing removeDataset with existing id", function () {
        return facade.removeDataset("rooms").then(function (value: InsightResponse) {
            expect(value.code).to.equal(204)
        }).catch(function (err) {
            Log.test('Error: ' + err);
            expect.fail();
        });
    });

    it("Testing removeDataset with new id", function () {
        return facade.removeDataset("rooms").then(function (value: InsightResponse) {
            expect(value.code).to.equal(404);
            console.log(value.code);
        }).catch(function (err:InsightResponse) {
            console.log(err.code)
        });
    });


});*/
