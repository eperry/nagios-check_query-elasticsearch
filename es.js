var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: '172.17.102.177:9200',
  log: 'trace'
});
var hits;
client.search(
                {
              "query": {
                "bool": {
                  "must": [
                    {
                      "query_string": {
                        "default_field": "wcs_logs.filename",
                        "query": "SystemOut.log"
                      }
                    },
                    {
                      "query_string": {
                        "default_field": "wcs_logs.host",
                        "query": "rftwwapp*"
                      }
                    },
                    {
                      "query_string": {
                        "default_field": "_all",
                        "query": "*CertPathValidatorException*"
                      }
                    },
                    {
                      "query_string": {
                        "default_field": "wcs_logs.t",
                        "query": "A"
                      }
                    },
                    {
                      "query_string": {
                        "default_field": "wcs_logs.component",
                        "query": "ConnectionEve"
                      }
                    },
                    {
                      "range": {
                        "wcs_logs.@timestamp": {
                          "from": "now-6h"
                        }
                      }
                    }
                  ],
                  "must_not": [],
                  "should": []
                }
              },
              "from": 0,
              "size": 10,
              "sort": [],
              "facets": {},
              "fields": [
                "host",
                "path"
              ]
            }
    ).then(function (resp) {
      hits = resp.hits.hits;
      client.close()
    }, function (err) {
      console.trace(err.message);
      client.close()
  });

console.log(hits);