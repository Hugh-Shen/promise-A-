/**
 * 定义常量 保存状态
 */
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

/**
 * 实现一个 promise 构造函数
 * @executor 接受两个参数，分别是 resolve 和 reject
 */

function Promise(executor) {
  let self = this // 缓存正确的 this 指向
  self.status = PENDING // 初始化状态
  self.onFulfilled = [] // 成功回调
  self.onRejected = [] // 失败回调

  /**
   *  @resolve 实现一个成功时的方法 {调用 resolve 方法时，把状态更改为执行后的状态，保存传递的参数值并遍历执行成功回调}
   *  @reject 实现一个失败时的方法 {调用 reject 方法时，把状态更改为执行后的状态，保存传递的参数值并遍历执行成功回调}
   */
  function resolve(value) { 
    if(self.status === 'pending') {
      self.status = FULFILLED 
      self.value = value
      self.onFulfilled.forEach(fn => fn(value));
    }
  }

  function reject(value) {
    if(self.status === 'pending') {
      self.status = REJECTED
      self.err = value
      self.onRejected.forEach(fn => fn(value));
    }
  }

  /**
   * 创建 promise 实例时，立即执行 excutor
   */
  try {
    executor(resolve, reject)
  } catch(e) {
    reject(e)
  }
}

/**
 * @then 在 promise 原型链上创建一个 then 方法，用来接收返回的值。
 * @onFulfilled @onRejected {
 *  该方法提供两个可选的参数，如果不是函数需要转换为函数来处理返回值且必须为是一个异步处理过程
 *  等待前面的函数处理完成
 * }
 */

Promise.prototype.then = function(onFulfilled, onRejected) {
  let self = this // 保证正确的 this指向， this 指向原型

  //  重写 onFulfilled 与 onRejected 方法，保证其为函数来返回不同结果的值
  onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value
  onRejected = typeof onRejected === "function" ? onRejected : err => {throw err}

  let promise2 = new Promise((resolve, reject) => { // promise 接收一个 executor 函数
    /**
     * @status 访问原型上的状态，来处理不同的结果
     */
    if(self.status === FULFILLED) {
      setTimeout(() => {
        try {
          let x = onFulfilled(self.value)
          resolvePromise(promise2, x, resolve, reject);
        } catch(e) {
          reject(e)
        }
      });
    }else if(self.status === REJECTED) {
      setTimeout(() => {
        try {
          let x = onRejected(self.err)
          resolvePromise(promise2, x, resolve, reject);
        } catch(e) {
          reject(e)
        }
      });
    }else if(self.status === PENDING) {
      /**
       * @status 如果状态是 pending,把 then 方法传递的函数添加到构造函数的成功与失败的任务堆里面
       */
      self.onFulfilled.push(() => {
        setTimeout(() => {
          try {
            let x = onFulfilled(self.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e)
          }
        })
      })

      self.onRejected.push(() => {
        setTimeout(() => {
          try {
            let x = onRejected(self.err);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e)
          }
        })
      })
    }
  })
  // 返回这个结果
  return promise2
}

Promise.prototype.catch = function(onRejected) {
  this.then(null, onRejected)
}

function resolvePromise(promise2, x, resolve, reject) {
  // 判断 promise2 与 x 是否相等，防止循环引用，状态无法被改变
  if(promise2 === x) {
    return reject(new TypeError('循环引用'))
  }
  let onece; // 用来记录调用 （只能调用一次）
  if(x && typeof x === 'object' || typeof x === 'function') { // 如果有 then 方法就执行
    try {
      let then = x.then
      if(typeof then === 'function') { // 如果返回的 then 还是一个函数
        then.call(x, function(y) {
          if(onece)return // 只能调用一次
          onece = true
          resolvePromise(promise2, x, resolve, reject)
        }, function(err) {
          if(onece)return // 只能调用一次
          onece = true
          reject(err)
        })
      }else { // 如果 then 不是一个函数，直接返回该结果
        if(onece)return // 只能调用一次
        onece = true
        resolve(x)
      }
    }catch {
      if(onece)return // 只能调用一次
      onece = true
      reject(x)
    }
  }else {
    reject(x)
  }
}

module.exports = Promise;