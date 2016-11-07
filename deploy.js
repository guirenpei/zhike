
'use strict'
const fs = require('fs-extra-promise');
const co = require('co');
const path = require('path');
const dst = path.join(__dirname,'./public')
const exec = require('child_process').exec;
co(function *() {
	let files = yield fs.readdirAsync(__dirname);
	let olds = JSON.parse(yield fs.readFileAsync(path.join(__dirname,'./ignore.json')))
	let newAdd = yield addFiles(yield isDir(files),olds)
	let newold = yield judgeFile(newAdd);
	//先删除public文件夹下所有文件(包括自己)
	//创建一个public文件夹
	yield removeFiles(dst)
	yield fs.mkdirAsync(dst)
	//复制站点文件夹到指定文件夹中
	for(const _newold of newold) {
		yield exists(_newold,dst,copy)
	}
	yield gitAdd();
	try{
		yield gitCommit(newold);
		yield gitPush();
	}catch(err){
		console.log(err);
	}
	console.log();
}).catch(e => {
	console.log(e);
})
/**
	查找出目录下所有的目录
*/
function *isDir(paths) {
	let dirs = [];
	paths.map(function(el,i){
		let st = fs.statSync(el);
		if(st.isDirectory()){
			dirs.push(el);
		}
	})
	return dirs;
}
/**
	查找出目录下新增目录
*/
function *addFiles(dirs,olds) {
	let newAdd = []
	dirs.map((el,i) => {
		if(dirs.length > olds.length){
			if(olds.indexOf(dirs[i]) == -1){
				newAdd.push(dirs[i]);
			}
		}
	})
	return newAdd;
}
/**
	复制文件夹内的文件到指定文件中
*/
function *copy(src,dst) {
	let files = yield fs.readdirAsync(path.join(__dirname,src));
	for(const file of files) {
		let _src = path.join(src,file);
		let _dst = path.join(dst,file);
		let readable;
		let writable;
		let stats = yield fs.statAsync(_src);
		//判断是否为文件
		if(stats.isFile()){
			//创建读取流
			readable = fs.createReadStream(_src);
			//创建写入流
			writable = fs.createWriteStream(_dst);
			//通过管道来传输流
			readable.pipe(writable)
		}
		//如果是目录自身则递归调用自身
		if(stats.isDirectory()){
			yield exists(_src,_dst,copy)
		}
	}
}
/**
	判断是否存在相应文件夹如果存在则执行copy，
	如果不存在则创建相应文件夹再执行copy
*/
function *exists(src,dst,cb){
	const exists = yield fs.existsAsync(dst);
	if(exists){
		yield cb(src,dst);
	}else{
		yield fs.mkdirAsync(dst);
		yield cb(src,dst)
	}
}
/**
	删除指定文件夹及子文件夹下的内容
*/
function *removeFiles(src){
	let files = yield fs.readdirAsync(src);
	let exists = yield fs.existsAsync(src);
	if(exists){
		for (const file of files) {
			let _src = path.join(src,file);
			let stats = yield fs.statAsync(_src);
			if(stats.isDirectory()){
				yield removeFiles(_src);
			}else{
				yield fs.unlinkAsync(_src);
			}
		}
		yield fs.rmdirAsync(src);
	}
}
/**
	判断新加入的文件夹的先后顺序，并排列成数组
*/
function *judgeFile(newAdd) {
	let newold = new Map();
	let times = [];
	let files = [];
	for(const file of newAdd) {
		let stat = yield fs.statAsync(path.join(__dirname,file));
		let time = new Date(stat.mtime).getTime();
		newold.set(time,file);
	}
	for(const key of newold.keys()) {
		times.push(key)
	}
	times.sort((a,b) => a-b);
	for(const t of times) {
		files.push(newold.get(t));
	}
	return files;
}
/**
	复制文件结束后将所有代码通过git提交
*/
// let exec = require('child_process').exec;
// exec('node server',(error, stdout, stderr) => {
// 	if(error !== null){
// 		console.log('exec error : ' + error);
// 	}
// 	console.log(stdout);
// 	console.log(stderr);
// })
// function *updateGit(newold){
// 	exec('git add public', (error, stdout, stderr) => {
// 		if(error != null){
// 			console.log('exec add error :' + error);
// 		}
// 		let time = new Date().getTime();
// 		let boo = yield gitStatus();
// 		if(boo){
// 			exec('git commit -m ' + '通过deploy自动更新文件夹-' + newold.join(','),(error, stdout, stderr) => {
// 				if(error != null){
// 					console.log('exec commit error :' + error);
// 				}
// 				exec('git push origin master',(error, stdout, stderr) => {
// 					if(error != null){
// 						console.log('exec push error :' + error);
// 					}
// 				})
// 			})
// 		}
// 	})
// }

// resolve({stdout, stderr})


// const output = yield  execAsync(xxx);

/**
	判断git的状态
*/
function gitStatus() {
	return new Promise((resolve, reject) => {
		exec('git status',(error, stdout, stderr) => {
			if(error != null){
				reject(error);
			}		
			resolve(stdout.includes('Changes to be committed'));
		})
	});
}
function gitAdd() {
	return new Promise((resolve, reject) => {
		exec('git add public',(error, stdout, stderr) => {
			if(error != null){
				reject(error);
			}
			resolve({stdout, stderr});
		})
	});
}
function gitCommit(newold) {
	return new Promise((resolve, reject) => {
		exec('git commit -m ' + '通过deploy自动更新文件夹-' + newold.join(','),(error, stdout, stderr) => {
			if(error != null){
				reject(error);
			}		
			resolve({stdout, stderr});
		})
	});
}
function gitPush() {
	return new Promise((resolve, reject) => {
		exec('git push origin master',(error, stdout, stderr) => {
			if(error != null){
				reject(error);
			}
			resolve({stdout, stderr});
		})
	});
}
// fs.writeFile(..., (res) => {});
// res = fs.writeFileSync(...); 

// fs.writeFileAsync(...).then(res);
// res = yield fs.writeFileAsync(...);