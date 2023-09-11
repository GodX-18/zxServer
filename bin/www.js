#! /usr/bin/env node

const { program } = require("commander"); // 引入commander模块，用于处理命令行参数

// program.option("-p --port", "set server port");

// 配置信息
let options = {
  "-p --port <dir>": {
    description: "init server port", // 设置服务器端口的描述
    example: "zxserver -p 3366" // 设置服务器端口的示例
  },
  "-d --directory <dir>": {
    description: "init server directory", // 设置服务器目录的描述
    example: "zxserver -d c:" // 设置服务器目录的示例
  }
};

function formatConfig(configs, cb) {
  Object.entries(configs).forEach(([key, val]) => {
    cb(key, val); // 遍历配置对象，执行回调函数
  });
}
formatConfig(options, (cmd, val) => {
  program.option(cmd, val.description); // 根据配置对象，添加命令行选项
});

program.on("--help", () => {
  console.log("Example: "); // 当用户输入--help时，打印示例信息
  formatConfig(options, (cmd, val) => {
    console.log(val.example); // 打印每个选项的示例
  });
});

program.name("lgserve"); // 设置程序的名称

let version = require("../package.json").version; // 获取程序的版本号
program.version(version); // 设置程序的版本号

let cmdConfig = program.parse(process.argv); // 解析命令行参数，返回一个对象

// console.log("GodX------>log", cmdConfig); // 打印解析后的对象

let Server = require("../main.js");

new Server(cmdConfig).start();
