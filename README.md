# SDU-CG-2020

> 这是2020年SDU计算机图形学研究生课程的期末代码部分

## 文件结构

```
* src 程序源代码
|-* entry.js 渲染器代码
|-* rbf.js RBF算法代码
* public 辅助文件
|-* index.html 页面框架
|-* cube.obj 正方体模型
|-* human.obj 人物模型
|-* mask.obj 面具模型
|-* mask-rbf.obj 面具点云
|-* sphere-rbf.obj 半球点云
* dist 打包文件
|- index.html 主页面
```

## 如何运行

你可以选择其中一种方式运行本项目：

* `yarn`安装依赖之后，使用`yarn start`构建网页
* 直接打开已构建好的`dist/index.html`文件