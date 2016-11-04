let exec = require('child_process').exec;

// //捕获标准输出并将其打印到控制台
// free.stdout.on('data',data => console.log('标准输出：/\n' + data))

// //捕获标准错误输出并将其打印到控制台
// free.stderr.on('data',data => console.log('标准错误输出：/\n' + data))

// //注册子进程关闭时间
// free.on('exit',(code, signal) => console.log('子进程已退出，代码：' + code))
exec('git add deploy.js',(error, stdout, stderr) => {
	if(error !== null){
		console.log('exec error : ' + error);
	}
	console.log(stdout);
	console.log(stderr);
})