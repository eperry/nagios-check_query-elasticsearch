/*********************************************************************
 * Global functions and objects
 *********************************************************************/
 
//Disable outputs
//console.log = console.log || function(){};
//console.warn =  function(){};
//console.error = function(){};
console.info =  function(){};
var urls = require('url');
//var https = require('https');
//var http = require('http');
//var http = require('./clienthttp.js');
var debug=0;
var https_options = {};
var http_proxy="proxy.saksdirect.com:80";
var url="https://localhost/";
var http_password="nobody";
var http_user="nobody";
var warning_level=10000;
var critical_level=100000;
var index_name="_all";
var search_filename="~/libexec/lib/check_es.d/etc/CertPathValidatorException.json";
//var config;
var orderStatus = {
    ordersExportToday :0,
    ordersReadyForExport :0,
    ordersExportFailed :0
};
var RET_STATUS = {
    state:3,
    message:"",
    STATUS : {
        'OK'        : 0,
        'WARNING'   : 1,
        'CRITICAL'  : 2,
        'UNKNOWN'   : 3
    },
    'getStatus' : function (val){
        if(typeof val === "undefined"){
            val= this.state;
        }
        switch (val){
            case 0: return "OK";
            case 1: return "WARNING";
            case 2: return "CRITICAL";
            default: return "UNKNOWN";
        }
    },
    'setMessage': function (val){
        this.message+=val+",";
    },
    'setStatus': function (val){ 
        console.info("In setStatus "+val);
        if(/\w+/.test(val)){
            console.info("In setStatus - convert value from word to diget "+val);
            if (/OK/.test(val)){
                val=this.STATUS.OK;
            }else
            if (/WAR\w+/.test(val)){
                val=this.STATUS.WARNING;
            }else 
            if (/CRI\w+/.test(val)){
                val=this.STATUS.CRITICAL;
            }else
                val=this.STATUS.UNKNOWN;
         }
         console.info("In setStatus -  digit value "+val);
        if (/\d/.test(val)){
            switch (val){
                case this.STATUS.OK : 
                    if(this.state === this.STATUS.UNKNOWN) {
                        this.state=this.STATUS.OK; 
                    }
                    break;
                case this.STATUS.WARNING : 
                    if(this.state !== this.STATUS.CRITICAL) this.state=this.STATUS.WARNING; 
                    break;
                case this.STATUS.CRITICAL :  
                    console.info("setting critical");
                    this.state=this.STATUS.CRITICAL; 
                    break;
                //default : if(this.state <= this.STATUS.OK) this.state=this.STATUS.UNKNOWN; break;
            }
        }
        
    }
 };
 
 
var check_status = function check_status(jsonResponse){
    /***************
     * Check the status of the JSON Page
     ****************/
     console.info(JSON.stringify(jsonResponse,null, '\t'));
     if (jsonResponse.hits.total > 0 ) {
        RET_STATUS.setStatus("CRITICAL");
        //var results=jsonResponse.hits.hits;
        //var filenames={};
        //var hostnames={};
        //for(var i=0;i< results.length;i++){
            //filenames[results[i].fields.path[0]]++;
            //hostnames[results[i].fields.host[0]]++;
            //console.info(results[i].fields.host[0]+" -> "+results[i].fields.path[0]);
        //}
        RET_STATUS.setMessage("Found "+jsonResponse.hits.total+" Document Matches "); 
        
     }else{
        RET_STATUS.setStatus("OK");
        RET_STATUS.setMessage("OK");
     }


};

/*********************************************************************
 * EVENTS/Emitters
 *********************************************************************/
var events = require('events');
var eventEmitter = new events.EventEmitter();

eventEmitter.on('check_status', check_status);


/*********************************************************************
 * Process command arguments
 *********************************************************************/
console.info("Processing Commandline arguments");

process.argv.forEach(function (val, index, array) {
    if(/(-h|--help|-\?)/.test(val) ){
        console.log(process.argv[0]+":");
        console.log("\t[--url="+url+"]");
        console.log("\t[--user=username]     default: "+http_user);
        console.log("\t[--password=password] default: "+http_password);
        console.log("\t[--warning=#]         default: "+warning_level+" running time of a job in seconds (global)");
        console.log("\t[--critical=#]        default: "+critical_level+" running time of a job in seconds (global)");
        console.log("\t[--search=<filename>  default: "+searchg_filename);
        console.log("\t[--index=<indexname>   default: "+index_name);
        console.log("\t\t\tFormat of cfg file is in json format, and is a ElasticSearch Format");
        RET_STATUS.message="HELP: Command";
        process.exit(RET_STATUS.STATUS.UNKNOWN)
    }
    if(val.indexOf('=') >0){
        var s = val.split(/=/);
        if(s.length !== 2 ){
            console.info("Problem with arg no '=' found :"+val);
            process.exit(RET_STATUS.STATUS.CRITICAL);
        }
        console.info(s[0] + ' : ' + s[1]); 
        
        if (s[0] === "--url" ){
        url=s[1];
            https_options=urls.parse(s[1]);
            
        }
        if (s[0] === "--user" ){
            http_user=s[1];
        }
        if (s[0] === "--password" ){
            http_password=s[1];
        }
        if (s[0] === "--critical" ){
            critical_level=s[1]*1000;
        }
        if (s[0] === "--warning" ){
            warning_level=s[1]*1000;
        }
        if (s[0] === "--proxy" ){
            http_proxy=s[1]
        }
        if (s[0] === "--index" ){
            index_name=s[1]
	    console.info("index_name="+index_name);
        }
        if (s[0] === "--search"){
            search_filename=s[1];
            var fs = require('fs');
            if (fs.existsSync(search_filename)) {
                var fileContents = fs.readFileSync(search_filename,'utf8'); 
                console.info(fileContents);
                //config = JSON.parse(fileContents);
            }else{
                console.log("file does not exist:"+search_filename);
                process.exit(RET_STATUS.STATUS.CRITICAL);
            }
        }
    }
});
https_options.auth = 'Basic ' + new Buffer(http_user+":"+http_password).toString('base64');
/*********************************************************************
 * Main 
 *********************************************************************/
 /***************
 * Fetch the site
 ****************/
 var useWGET=1;
 if (useWGET){
     //var wget='/usr/bin/curl -s --data @search-ssl.txt "http://rftelkp01.hbc.com:9200/'+index_name+'/_search?search_type=count" ';
     var wget='/usr/bin/curl -s -XPOST --data @'+search_filename+' "http://rftelkp01.hbc.com:9200/'+index_name+'/_search" ';
     console.info(wget);
     var sys = require('sys');
     var exec = require('child_process').exec;
     var child;
      var jsonResponse="";
      child = exec(wget, {},function (error, stdout, stderr) {
        console.info('exec error: ' + error);
        console.info('stdout: ' + stdout);
        //jsonResponse+=stdout;
	jsonResponse = JSON.parse(stdout);
        eventEmitter.emit('check_status',jsonResponse);
      });
 }else{
       var fs = require('fs');
       if (fs.existsSync("./search-ssl.output")) {
                var fileContents = fs.readFileSync("./search-ssl.output",'utf8');
          //     console.info(fileContents);
       		jsonResponse = JSON.parse(fileContents);
	  eventEmitter.emit('check_status',jsonResponse);
       }else{
               console.log("file does not exist: ./search-ssl.output");
	       process.exit(RET_STATUS.STATUS.CRITICAL);
       }
	

 }

/*function(res) {
  console.info("Got response: " + res.statusCode);
  console.info(res.headers);
  var jsonResponse="";
  res.on('data', function (chunk) {
    // Receive the data and append to global varable
    console.info('BODY: ' + chunk);
    jsonResponse+=chunk;
  });
  res.on('end',function(){
      // Call the check_status function when all data has been received
      eventEmitter.emit('check_status',jsonResponse);
  })
});
get.on('error', function(e) {
  console.error("Got error: " + e.message);
  process.exit(RET_STATUS.STATUS.CRITICAL);
});
*/

process.on('exit', function(code) {
    console.log(RET_STATUS.getStatus()+" - "+RET_STATUS.message );
    process.exit(RET_STATUS.state);
});
process.on('uncaughtException', function(err) {
  console.log('-Caught exception: ' + err.stack);
  process.exit(RET_STATUS.getStatus("UNKNOWN"));
});
