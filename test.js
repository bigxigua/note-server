static resolve(params) {
  if (params instanceof PromiseA) {
    return params;
  } else {
    return new PromiseA((resolve) => {
      resolve(params);
    });
  }
};
static reject() {
  if (params instanceof PromiseA) {
    return params;
  } else {
    return new PromiseA((resolve, reject) => {
      reject(params);
    });
  }
}
static all(promiseQueue) {
  return new Promise2((resolve, reject) => {
    let index = 0;
    let len = promiseQueue.len;
    let result = [];
    promiseQueue.forEach((promise) => {
      MyPromise.resolve(promise).then((d) => {
        index++;
        result.push(d);
        if (index === len) {
          resolve(result);
        }
      });
    }, (e) => {
      reject(e);
    });
  });
}
static race() {
  return new Promise2((resolve, reject) => {
    promiseQueue.forEach((promise) => {
      MyPromise.resolve(promise).then((d) => {
        resolve(d);
      });
    }, (e) => {
      reject(e);
    });
  });
}
catch (handle) {
  return this.then(undefined, handle);
}
finally(callback) {
  return this.then(
    value => MyPromise.resolve(callback()).then(() => value),
    reason => MyPromise.resolve(callback()).then(() => { throw reason })
  )
}