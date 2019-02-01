/**
 * Created by rtholmes on 2016-10-31.
 */
/*
import Server from "../src/rest/Server";
import {expect} from 'chai';
import Log from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";

var fs = require('fs');
var JSZip = require('jszip');

describe("EchoSpec", function () {


    function sanityCheck(response: InsightResponse) {
        expect(response).to.have.property('code');
        expect(response).to.have.property('body');
        expect(response.code).to.be.a('number');
    }

    before(function () {
        Log.test('Before: ' + (<any>this).test.parent.title);
    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
    });

    after(function () {
        Log.test('After: ' + (<any>this).test.parent.title);
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
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


    it("test add courses.zip", function (done) {
        this.timeout(50000)

        var zip = new JSZip();
        var temp_1 = "./courses.zip";
        var f = fs.readFileSync(temp_1, {encoding: "base64"});

        var temp = new InsightFacade();

        temp.addDataset("courses", f)
            .then((response) => {
                console.log(response.code);
                done();
            })
            .catch((err) => {
                Log.test("incatch");
                done(err);
            });

    });

    it("invalid query-> order", function (done) {

        this.timeout(500000);


        var temp = new InsightFacade();

        var s1 = {
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
                "ORDER": {
                    "courses_uuid": "courses_avg"
                },
                "FORM": "TABLE"
            }
        };


        var query = s1;

        temp.performQuery(query).then(function (body) {

            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);
            //;
            done();
        })

    });


    it("test 424 1 ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
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
        };


        var query = s1;
        temp.performQuery(query).then(function (body) {

            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);
            //;
            done();
        })

    });

    it("test single NOT ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
                "WHERE": {
                    "AND": [
                        {
                            "IS": {
                                "courses_dept": "cp*"
                            }
                        }

                    ]
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER": "courses_avg",
                    "FORM": "TABLE"
                }
            }
            ;


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });


    it("test complex 424  ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
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
            }
            ;


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);
            done();
        })

    });


    it("test courses in one dept 70-80 ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courses_avg": 70
                    }
                }, {
                    "IS": {
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
        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {

            done();
        })

    });


    it("empty GT ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
            "WHERE": {
                "AND": [{
                    "GT": {}
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
        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);
            done();
        })

    });


    it("test contradictory query ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courses_avg": 90
                    }
                }, {
                    "EQ": {
                        "courses_avg": 77
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
        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });


    it("test 400 1 invalid key ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courses_avg": 90.8
                    }
                }, {
                    "EQ": {
                        "courses_avg": 77.2
                    }

                }, {
                    "IS": {
                        "courses_dep": "cpsc"
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
        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });


    it("test 400 2 undefined and ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
            "WHERE": {}
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

        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });


    it("test 400 4  ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
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

        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });

    it("test 400 3  ", function (done) {
        this.timeout(50000)


        var temp = new InsightFacade();

        var s1 = {
            "WHERE": {
                "OR": [
                    {
                        "GT": {"courses_avg": 90}
                    },
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

        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });


    it("test double negation 99 ", function (done) {
        this.timeout(50000);


        var s1 = {
            "WHERE": {
                "NOT": {
                    "NOT": {
                        "OR": [

                            {
                                "EQ": {
                            courses_ag: 98
                                }
                            }
                        ]
                    }
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_id",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"

            }
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            console.log(result.body);
            done();
        }).catch(function (result) {
            console.log(result.code);
            //;
            done();
        });


    });

    it("test complex double negation ", function (done) {
        this.timeout(50000);


        var s1 = {
            "WHERE": {
                "NOT": {
                "NOT": {

                    "AND": [
                        {
                            "GT": {
                                "courses_avg": ""
                            }
                        },
                        {
                            "IS": {
                                "courses_dept": "adhe"
                            }
                        }
                    ]
                }
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_id",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"

            }
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            ////;
            done();
        }).catch(function (result) {
            console.log(result.code);
            //;
            done();
        });


    });


    it("invlid order ", function (done) {
        this.timeout(50000);


        var s1 = {
            "WHERE": {

                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_av",
                "FORM": "TABLE"
            }
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (result) {
            console.log(result.code);
            //;
            done();
        });


    });


    it("test invalid query ", function (done) {
        this.timeout(50000);


        var s1 = ' {' +
            '"WHERE":{' +
            '"NOT": {' +
            '"NOT": {' +
            '"OR": [' +
            '{' +
            '"AND": [' +
            ']' +
            '},' +
            '{' +
            '"EQ": {' +
            '"courses_avg": 95' +
            '}' +
            '}' +
            ']' +
            '}}' +
            '},' +
            '"OPTIONS":{' +
            '"COLUMNS":[' +
            '"courses_dept", "courses_id", "courses_avg"],"ORDER":"courses_avg", "FORM":"TABLE"' +
            '}' +
            '}';

        //
        var query = {content: s1};
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (result) {
            console.log(result.code);
            //;
            done();
        });


    });

    it("test 424 abcd ", function (done) {
        this.timeout(50000)


        var s1 = {
            "WHERE": {
                "AND": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "a_avg": 63.99
                                }
                            }
                            , {
                                "EQ": {
                                    "b_avg": 64
                                }
                            }
                        ]
                        ,
                        "IS": {
                            "c_avg": 63.99
                        }
                    }
                    , {
                        "EQ": {
                            "d_avg": 64
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
        }


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })


    });


    it("test EQ 1 ", function (done) {
        this.timeout(50000)


        var s1 = {
            "WHERE": {

                "OR": [
                    {
                        "EQ": {
                            "courses_avg": 95.2
                        }
                    },
                    {
                        "EQ": {
                            "courses_avg": 95.1
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
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            }
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            ////;
            done();
        }).catch(function (err) {
            console.log(err.body);
            console.log(err.code);
            //;

            done();
        })


    });


    // it("test EQ 2 ", function (done) {
    //     this.timeout(50000)
    //
    //
    //     var s1 = {
    //         "WHERE": {
    //             "EQ": {
    //                 "courses_avg": 95
    //             },
    //
    //             "GT": {
    //                 "courses_avg": 64
    //             }
    //
    //         },
    //         "OPTIONS": {
    //             "COLUMNS": [
    //                 "courses_dept",
    //                 "courses_avg",
    //                 "courses_uuid",
    //                 "courses_title",
    //                 "courses_instructor",
    //                 "courses_fail",
    //                 "courses_audit",
    //                 "courses_pass"
    //             ],
    //             "ORDER": "courses_avg",
    //             "FORM": "TABLE"
    //         }
    //     };
    //
    //
    //     var query = s1;
    //     var temp = new InsightFacade();
    //
    //
    //     temp.performQuery(query).then(function (result) {
    //         console.log(result.code);
    //         ////;
    //         done();
    //     }).catch(function (err) {
    //         console.log(err.code);
    //         //;
    //
    //         done();
    //     })
    //
    //
    // });


    it("test EQ 2 ", function (done) {
        this.timeout(50000)


        var s1 = {
            "WHERE": {
                "EQ": {
                    "courses_avg": 95
                },

                "GT": {
                    "courses_av": 64
                }

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
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            ////;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })


    });

    it("test partial ", function (done) {
        this.timeout(50000)


        var s1 = {
            "WHERE": {
                "OR": [{
                    "AND": [{
                        "IS": {
                            "courses_instructor": "lyons, charles"
                        }
                    }
                        , {
                            "IS": {
                                "courses_instructor": "*a*"
                            }

                        }
                    ]
                }

                ]


            },
            "OPTIONS": {
                "COLUMNS": [

                    "courses_uuid",

                    "courses_instructor"

                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            }
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            ////;

            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })


    });


    it("test partial 3 all courses in one dept but taught by ", function (done) {
        this.timeout(50000)


        var s1 = {
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
                                "courses_instructor": "hu, alan"
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
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            ////;
            //console.log(result.body["result"].length);
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })


    });


    it("test partial all courses in one dept except some specific example ", function (done) {
        this.timeout(50000)


        var s1 = {
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "courses_dept": "*sc*"
                        }
                    }
                    ,
                    {
                        //  "NOT": {
                        "IS": {
                            "courses_uuid": "129*"
                        }
                        // }

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
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            ////;
            //console.log(result.body["result"].length);
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })


    });


    it("test partial 4 ", function (done) {
        this.timeout(50000)

        //All courses in cpsc except for some course of which uuid range is some specified range
        var s1 = {
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "courses_dept": "*cpsc"
                        }
                    }
                    // ,
                    // {
                    //     //"NOT": {
                    //         "OR": [
                    //
                    //             {
                    //                 "GT": {
                    //                     "courses_avg": 90
                    //                 }
                    //             },
                    //             {
                    //                 "IS": {
                    //                     "courses_uuid": "*130"
                    //                 }
                    //             }
                    //
                    //         ]
                    //     //}
                    //
                    // }

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
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            //console.log(result.body["result"].length);
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })


    });


    it("test not ", function (done) {
        this.timeout(10000)

        //All courses in cpsc except for some course of which uuid range is some specified range
        var s1 = {
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
        };


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            ////;
            //  console.log(result.body["result"].length);
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })


    });


    it("test 424 2223 ", function (done) {
        this.timeout(10000)


        var temp = new InsightFacade();

        var s1 = {
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
        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);
            //;
            done();
        })

    });

    it("test 424 2222 ", function (done) {
        this.timeout(10000)


        var temp = new InsightFacade();

        var s1 = {
            "WHERE": {
                "AND": [{
                    "AND": [{
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
                        "coursesavg": 63.99
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
        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code)
            console.log(err.body);
            //;
            done();
        })

    });


    it("test set of instructors ", function (done) {
        this.timeout(10000)


        var temp = new InsightFacade();

        var s1 = {
            "WHERE": {
                "OR": [
                    {
                        "IS": {
                            "courses_instructor": "*hu, a*"
                        }
                    },
                    {
                        "IS": {
                            "courses_instructor": "*wolfman"
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
        };


        var query = s1;
        temp.performQuery(query).then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });

    it("test 424 abcd ", function (done) {
        this.timeout(10000)


        var s1 = {
            "WHERE": {
                "AND": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "a_avg": 63.99
                                }
                            }
                            , {
                                "EQ": {
                                    "b_avg": 64
                                }
                            }
                        ]
                        ,
                        "IS": {
                            "c_avg": 63.99
                        }
                    }
                    , {
                        "EQ": {
                            "d_avg": 64
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
        }


        var query = s1;
        var temp = new InsightFacade();


        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })


    });

    it("test Empty not", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "NOT": {}

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })


    });

    it("test too many param not", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "NOT": {
                    "GT": {
                        "courses_avg": 99
                    },
                    "LT": {
                        "courses_avg": 1
                    }
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })


    });

    it("test empty or", function (done) {
        this.timeout(10000)

        var s1 = '{' +
            '"WHERE": {' +
            '"OR": []' +

            '},' +
            '"OPTIONS": {"COLUMNS": ["courses_dept","courses_avg"],' +
            '"ORDER": "courses_avg",' +
            '"FORM": "TABLE"' +
            '}' +
            '}';
        var query = JSON.parse(s1);
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })


    });

    it("test empty and", function (done) {
        this.timeout(10000)

        var s1 = '{' +
            '"WHERE": {' +
            '"AND": []' +

            '},' +
            '"OPTIONS": {"COLUMNS": ["courses_dept","courses_avg"],' +
            '"ORDER": "courses_avg",' +
            '"FORM": "TABLE"' +
            '}' +
            '}';
        var query = JSON.parse(s1);
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })


    });

    it("test empty eq", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "EQ": {}

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })
    });
    it("test too many param eq", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "EQ": {
                    "courses_avg": 99,
                    "courses_fail": 1
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })
    });


    it("test tpye error eq", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "EQ": {
                    "courses_avg": "99"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })
    });
    it("test tpye error IS", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "IS": {
                    "courses_dept": 99
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            Log.info(err.toString());
            Log.warn(err.toString());
            Log.error(err.toString());
            var servers = new Server(88);
            servers.start();
            servers.stop();

            done();
        })
    });

    it("test empty LT", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "LT": {}

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });
    it("test too many param LT", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "LT": {
                    "courses_avg": 99,
                    "courses_fail": 1
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });


    it("test tpye error LT", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "LT": {
                    "courses_avg": "99"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });

    it("test too many param GT", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "GT": {
                    "courses_avg": 99,
                    "courses_fail": 1
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });
    it("test empty IS", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "IS": {}

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });
    it("test too many param IS", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "IS": {
                    "courses_dept": "99",
                    "courses_uuid": "1*"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });

    it("test FORM error", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "IS": {
                    "courses_dept": "99"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });

    it("test column error", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "IS": {
                    "courses_dept": "99"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_de",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });

    it("test invalid setValue", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "IS": {
                    "courses_dept": "99"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_de",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;

            done();
        })
    });


    it("test remove ", function (done) {
        this.timeout(10000)


        var temp = new InsightFacade();


        temp.removeDataset("courses").then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });

    it("test double remove ", function (done) {
        this.timeout(10000)


        var temp = new InsightFacade();


        temp.removeDataset("courses").then(function (body) {
            console.log(body.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            //;
            done();
        })

    });
    it("test readError", function (done) {
        this.timeout(10000)

        var s1 = {
            "WHERE": {
                "IS": {
                    "courses_dept": "99"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "FORM": "TABLE"
            }
        };
        var query = s1;
        var temp = new InsightFacade();
        temp.performQuery(query).then(function (result) {
            console.log(result.code);
            //;
            done();
        }).catch(function (err) {
            console.log(err.code);
            console.log(err.body);

            done();
        })
    });

});
*/