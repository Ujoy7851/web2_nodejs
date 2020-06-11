const http = require("http");
const fs = require("fs");
const url = require("url");
const qs = require("querystring");
const path = require("path");

let template = {
    HTML:(title, list, body, control) => {
      return `
      <!doctype html>
      <html>
      <head>
        <title>WEB1 - ${title}</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1><a href="/">WEB</a></h1>
        ${list}
        ${control}
        ${body}
      </body>
      </html>
      `;
    },
    list: (filelist) => {
      let list = '<ul>';
      let i = 0;
      while(i < filelist.length){
        list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
        i = i + 1;
      }
      list = list+'</ul>';
      return list;
    }
  }

const app = http.createServer((request, response) => {
    let _url = request.url;
    let queryData = url.parse(_url, true).query;
    let pathname = url.parse(_url, true).pathname;

    if (pathname === "/") {
        if (queryData.id === undefined) {
            fs.readdir("./data", (error, filelist) => {
                let title = "Welcome";
                let description = "Hello, Node.js";
                let list = template.list(filelist);
                let html = template.HTML(title, list, `<h2>${title}</h2>${description}`, `<a href="/create">create</a>`);
                response.writeHead(200);
                response.end(html);
            });
        } else {
            fs.readdir("./data", (error, filelist) => {
                let filteredId = path.parse(queryData.id).base;
                fs.readFile(`data/${filteredId}`, "utf8", (err, description) => {
                    let title = queryData.id;
                    let list = template.list(filelist);
                    let html = template.HTML(title, list,
                        `<h2>${title}</h2>${description}`, 
                        `<a href="/create">create</a>
                        <a href="/update?id=${title}">update</a>
                        <form action="/delete_process" method="post">
                            <input type="hidden" name="id" value=${title}>
                            <input type="submit" value="delete">
                        </form>
                        `);
                    response.writeHead(200);
                    response.end(html);
                });
            });
        }
    } else if (pathname === "/create") {
        fs.readdir("./data", (error, filelist) => {
            let title = "WEB - create";
            let list = template.list(filelist);
            let html = template.HTML(title, list,
                `
                <form action="/create_process" method="post">
                    <p><input type="text" name="title" placeholder="title"></p>
                    <p>
                    <textarea name="description" placeholder="description"></textarea>
                    </p>
                    <p>
                    <input type="submit">
                    </p>
                </form>
                `, ''
            );
            response.writeHead(200);
            response.end(html);
        });
    } else if(pathname === '/create_process') {
        let body = '';
        request.on('data', (data) => {
            body += data;
        });

        request.on('end', () => {
            let post = qs.parse(body);
            let title = post['title'];
            let description = post['description'];
            fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
                response.writeHead(302, {Location: `/?id=${title}`});
                response.end();
            });
        }); 
    } else if(pathname === '/update') {
        fs.readdir("./data", (error, filelist) => {
            let filteredId = path.parse(queryData.id).base;
            fs.readFile(`data/${filteredId}`, "utf8", (err, description) => {
                let title = queryData.id;
                let list = template.list(filelist);
                let html = template.HTML(title, list,
                    `
                    <form action="/update_process" method="post">
                        <input type="hidden" name="id" value=${title}>
                        <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                        <p>
                        <textarea name="description" placeholder="description">${description}</textarea>
                        </p>
                        <p>
                        <input type="submit">
                        </p>
                    </form>
                    `, '');
                response.writeHead(200);
                response.end(html);
            });
        });
    } else if(pathname === '/update_process') {
        let body = '';
        request.on('data', (data) => {
            body += data;
        });

        request.on('end', () => {
            let post = qs.parse(body);
            let id = post.id;
            let title = post.title;
            let description = post.description;
            fs.rename(`data/${id}`, `data/${title}`, (error) => {
                fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
                    response.writeHead(302, {Location: `/?id=${title}`});
                    response.end();
                });
            })
        });
    } else if(pathname === '/delete_process') {
        let body = '';
        request.on('data', (data) => {
            body += data;
        });

        request.on('end', () => {
            let post = qs.parse(body);
            let id = post.id;
            let filteredId = path.parse(id).base;
            fs.unlink(`data/${filteredId}`, (error) => {
                response.writeHead(302, {Location: '/'});
                response.end();
            });
        });
    } else {
        response.writeHead(404);
        response.end("Not found");
    }
});
app.listen(3000);
