// 引入http模块，用于创建服务器和处理请求
const http = require("http");
// 引入url模块，用于解析请求的url
const url = require("url");
// 引入path模块，用于处理文件路径
const path = require("path");
// 引入fs模块，用于操作文件系统，使用promises版本
const fs = require("fs").promises;
// 引入fs模块的createReadStream方法，用于创建可读流
const { createReadStream } = require("fs");
// 引入mime模块，用于获取文件的mime类型
const mime = require("mime");
// 引入ejs模块，用于渲染模板文件
const ejs = require("ejs");
// 引入util模块的promisify方法，用于将回调函数转换为promise对象
const { promisify } = require("util");

// 定义一个函数，用于合并默认配置和用户配置
function mergeConfig(config) {
  return {
    port: 8888, // 默认端口号为8888
    directory: process.cwd(), // 默认目录为当前工作目录
    ...config // 合并用户配置
  };
}

// 定义一个类，表示服务器对象
class Server {
  constructor(config) {
    this.config = mergeConfig(config); // 调用合并配置函数，获取最终配置
    // console.log("GodX------>log", this.config);
  }

  start() {
    // 创建一个http服务器，并传入一个处理请求的函数，绑定this指向
    let server = http.createServer(this.serveHandle.bind(this));
    // 监听配置中的端口号，并在启动后打印一条日志信息
    server.listen(this.config.port, () => {
      console.log("GodX------>log服务端已经启动了了....");
    });
  }
  // 定义一个异步函数，用于处理请求和响应
  async serveHandle(req, res) {
    // 解析请求的url，并获取路径名
    let { pathname } = url.parse(req.url);
    // 处理中文路径，将其解码为正常字符
    pathname = decodeURIComponent(pathname);
    // 将路径名和配置中的目录拼接，得到绝对路径
    let abspath = path.join(this.config.directory, pathname);
    try {
      // 使用fs模块的stat方法，获取文件或目录的状态对象
      let statObj = await fs.stat(abspath);
      if (statObj.isFile()) {
        // 如果是文件，则调用文件处理函数
        this.fileHandle(req, res, abspath);
      } else {
        // 如果是目录，则调用fs模块的readdir方法，获取目录下的所有文件名或目录名
        let dirs = await fs.readdir(abspath);
        // 将文件名或目录名映射为一个对象数组，包含相对路径和名称属性
        dirs = dirs.map((item) => {
          return {
            path: path.join(pathname, item),
            dirs: item
          };
        });
        // 使用promisify方法，将ejs模块的renderFile方法转换为返回promise对象的函数
        let renderFile = promisify(ejs.renderFile);
        // 获取当前路径的父路径
        let parentpath = path.dirname(pathname);
        // 调用renderFile方法，传入模板文件的绝对路径和数据对象，得到渲染后的html字符串
        let ret = await renderFile(path.resolve(__dirname, "template.html"), { arr: dirs, parent: pathname != "/", parentpath, title: path.basename(abspath) });
        // 将html字符串作为响应内容发送给客户端
        res.end(ret);
      }
    } catch (err) {
      // 如果发生错误，则调用错误处理函数
      this.errHandle(req, res, err);
    }
  }
  // 定义一个错误处理函数，接收请求、响应和错误对象作为参数
  errHandle(req, res, err) {
    console.log("GodX------>log", err); // 打印错误信息到控制台
    res.statusCode = 404; // 设置响应状态码为404
    res.setHeader("Content-type", "text/html;charset=utf-8"); // 设置响应头的内容类型为html
    res.end("Not Found"); // 设置响应内容为"Not Found"
  }
  // 定义一个文件处理函数，接收请求、响应和文件绝对路径作为参数
  fileHandle(req, res, abspath) {
    res.statusCode = 200; // 设置响应状态码为200
    // 设置响应头的内容类型为文件的mime类型，使用mime模块的getType方法获取
    res.setHeader("Content-type", mime.getType(abspath) + ";charset=utf-8");
    // 创建一个可读流，传入文件绝对路径，将其与响应对象连接，实现文件的传输
    createReadStream(abspath).pipe(res);
  }
}

// 将Server类导出，供其他模块使用
module.exports = Server;