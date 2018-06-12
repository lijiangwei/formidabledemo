var express = require('express');
var app = express();
var path = require("path");
const fs = require("fs");
const expressWs = require('express-ws')(app);
const formidable = require('express-formidable');
// const formidable = require('formidable');

app.use(express.static('public'));
app.use(formidable({
	encoding: 'utf-8',
	uploadDir: './public/upload/',
	keepExtensions: true,
}));

app.get('/', function (req, res) {
	res.send('hello world');
});

//上传图片接口 express-formidable
app.post('/able-web/uploadFile.do', (req, res) => {
	//req.fields; // contains non-file fields 
	let filePath = "";
	let fileName = "";
	let fileType = "";
	let files = req.files;
	for (var key in req.files) {
		if (files[key].path) {
			filePath = files[key].path;
			fileName = files[key].name;
			fileType = files[key].type;
			break;
		}
	}
	fileType = fileType.match(/\/(\w*)/)[1];
	let oldpath = filePath;
	let newpath = oldpath+"."+fileType;
	
	console.log("oldpath: ",oldpath);
	console.log("newPath: ",newpath);
	console.log("fileType: ", fileType);

	fs.rename(oldpath, newpath, function (err) {
		if (err) {
			console.error("改名失败" + err);
		}
		// res.render('index', { title: '文件上传成功:', imginfo: newfilename });
		console.log(path.normalize("http:\/\/localhost:3000\/" + newpath.replace("public\\", "")));
		res.append("Access-Control-Allow-Origin", "*");
		res.json({
			"uploaded": 1,
			"fileName": fileName,
			"url": "http://localhost:3000/" + newpath.replace("public\\", "").replace("\\","/"),
			"_ErrorCode": "000000"
		});
	});

});

// app.post('/able-web/uploadFile.do', (req, res) => {
// 	//req.fields; // contains non-file fields 
// 	var form = new formidable.IncomingForm();
// 	//设置编辑
// 	form.encoding = 'utf-8';
// 	//设置文件存储路径
// 	form.uploadDir = "./public/upload/";
// 	//保留后缀
// 	form.keepExtensions = true;

// 	form.parse(req, function (err, fields, files) {
// 		console.log(files);
// 		console.log(files.thumbnail.path);
// 		console.log('文件名:' + files.thumbnail.name);
// 		var t = (new Date()).getTime();
// 		//生成随机数
// 		var ran = parseInt(Math.random() * 8999 + 10000);
// 		//拿到扩展名
// 		var extname = path.extname(files.thumbnail.name);

// 		//path.normalize('./path//upload/data/../file/./123.jpg'); 规范格式文件名
// 		var oldpath = path.normalize(files.thumbnail.path);

// 		//新的路径
// 		let newfilename = t + ran + extname;
// 		var newpath = './public/upload/' + newfilename;
// 		console.warn('oldpath:' + oldpath + ' newpath:' + newpath);
// 		fs.rename(oldpath, newpath, function (err) {
// 			if (err) {
// 				console.error("改名失败" + err);
// 			}
// 			// res.render('index', { title: '文件上传成功:', imginfo: newfilename });
// 			res.append("Access-Control-Allow-Origin", "*");
// 			res.json({
// 				"uploaded": 1,
// 				"fileName": newfilename,
// 				"url": "http://localhost:3000/" + newfilename,
// 				"_ErrorCode": "000000"
// 			});
// 		});

// 	});
// });

let playId = 1;	//互动id
let totalCount = 1;
let submitCount = 0;
let joinList = [];
let websocket = null;
let intervalId = null;
let quesNo = 0;

//模拟joinPlay消息
let joinPlay = (userId) => {
	joinList.push(userId);
	let sendData = {
		msgType: "0",
		msgId: "joinPlay",
		msgData: {
			joinList: joinList,
		}
	};
	websocket.send(JSON.stringify(sendData));
};

function submitQues() {
	submitCount++;
	let sendData = {
		msgType: "0",
		msgId: "submitQues",
		msgData: {
			joinCount: 40,
			submitCount: submitCount
		}
	};
	websocket.send(JSON.stringify(sendData));
}

function startQues() {
	quesNo = 0;
	let sendData = {
		msgType: "0",
		msgId: "startQues",
		msgData: {
			quesNo: quesNo,
			stuNum: 2,
			playId: 1,
		}
	};
	websocket.send(JSON.stringify(sendData));
}

function displayAnswer() {
	let sendData = {
		msgType: "0",
		msgId: "displayAnswer",
		msgData: {
			quesNo: 0,
			answer: "1",
			rightAnswer: "0",
			timeConsume: 1500,
			optionResult: {
				1: 15,
				0: 10,
			},
			score: 10,
			rank: 2
		}
	};
	websocket.send(JSON.stringify(sendData));
}

app.ws('/able-web/websocket/websocket.ws', function (ws, req) {
	websocket = ws;
	ws.on('message', function (msg) {
		let msgData = JSON.parse(msg);
		console.log(msgData.msgId);
		let sendData = {
			msgType: "0",
			msgId: msgData.msgId,
			msgData: {
				pinCode: "123456",
			}
		};
		if (intervalId) {
			clearInterval(intervalId);
		}

		switch (msgData.msgId) {
			case 'startPlay':
				joinList = [];
				ws.send(JSON.stringify(sendData));
				//模拟加入5个人
				setTimeout(() => {
					for (let i = 1; i < 5; i++) {
						(function (userId) {
							joinPlay(i);
						})(i);
					}
				}, 3000);
				break;
			case 'startQues':
				sendData.msgData = {
					quesNo: 0,
					stuNum: 2,
					playId: 1,
				};
				ws.send(JSON.stringify(sendData));
				break;
			case 'displayAnswer':
				//测试代码
				sendData.msgData = {
					quesNo: 0,
					answer: "A",
					rightAnswer: "B",
					timeConsume: 1500,
					optionResult: {
						a: 15,
						b: 10,
						c: 10,
						d: 5
					},
					rankList: [
						{
							userId: 1,
							score: 100,
							rank: 2
						},
						{
							userId: 2,
							score: 90,
							rank: 2
						},
						{
							userId: 3,
							score: 80,
							rank: 2
						},
						{
							userId: 4,
							score: 60,
							rank: 2
						},
					]
				};
				ws.send(JSON.stringify(sendData));
				break;
			case 'joinPlay':
				sendData.msgData = {
					playId: playId,
					joinList: ["1", "2"],
				};
				ws.send(JSON.stringify(sendData));
				setTimeout(() => {
					startQues();
				}, 2000);
				break;
			case 'submitQues':
				setTimeout(() => {
					displayAnswer();
				}, 2000);
				break;
			case 'quitPlay':
			case 'closePlay':
				ws.send(JSON.stringify(sendData));
				break;
			case "nextQues":
				quesNo++;
				sendData.msgData = {
					quesNo: quesNo,
					stuNum: 2,
					playId: 1,
				};
				ws.send(JSON.stringify(sendData));
		}

	});
	ws.on("connect", function () {
		console.log("connect success.");
	});
});

app.listen(3000);