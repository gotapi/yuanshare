const url=require("url");
const fs=require("fs");
const http=require("http");
nodeup_Upload = function(pUrl,filePath, headers,callback,e_callback){
    let options = {
        headers:headers
    };
    let fileReader   = fs.createReadStream(filePath, {encoding: 'binary'});
    let fileContents = '';
    fileReader.on ('data', function(data) {
        fileContents += data;
    });
    fileReader.on('end', function() {
        var boundary = Math.random();
        var postData = [];
        var part = '';
        /**
          part = "--" + boundary + "\r\nContent-Type: application/atom+xml; charset=UTF-8\r\n\r\n" + xml + "\r\n";
          postData.push (new Buffer(part, "utf8"));
          */
        part = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"tosave\"; filename=\""+filePath+"\"\r\n\r\n";
        postData.push (new Buffer (part, 'ascii'));
        postData.push (new Buffer (fileContents, 'binary'));
        postData.push (new Buffer ("\r\n--" + boundary + "--"), 'ascii');
        var postLength = 0;
        for (let i = 0; i < postData.length; i++) {
            postLength += postData[i].length;
        }
        let must_headers = {
            'Content-Type': 'multipart/form-data;boundary="' + boundary + '"',
            'Content-Length': postLength,
            'Connection': 'close'
        }
        if(!options.headers) {
            options.headers = {};
        }
        for(let temp_index in must_headers){
            options.headers[temp_index]=must_headers[temp_index];
        }
        options.method  = "POST";
        /**
          if(body){
          body = qs.stringify(body);
        //options.headers['Content-Length'] = Buffer.byteLength(body)+postLength;
        }*/
        let req = http.request(pUrl,options, function(res) {
            let body = new Buffer(1024*10);
            let size = 0;
            res.on('data', function (chunk) {
                size+=chunk.length;
                if(size>body.length){//每次扩展10kb
                    let ex = Math.ceil(size/(1024*10));
                    let tmp = new Buffer(ex * 1024*10);
                    body.copy(tmp);
                    body = tmp;
                }
                chunk.copy(body,size - chunk.length);
            });
            res.on('end', function () {
                res.data = new Buffer(size);
                body.copy(res.data);
                res.body = res.data.toString();
                callback(res);
            });

        });
        /*if(body){
          console.log("写消息:"+body);  
          req.write(body);
          }*/
        for (let i = 0; i < postData.length; i++) {
            req.write (postData[i]);
        }
        req.on('error', function(e) {
            if(e_callback) e_callback (e);
        });
        req.end();
    });
}
