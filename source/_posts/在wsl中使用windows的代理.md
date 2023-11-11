---
title: 在wsl中使用windows的代理
date: 2023-11-11 16:49:41
tags:
  - wsl
  - linux
categories:
  - 编程
---

# 在wsl中使用windows的代理

参考：<https://zhuanlan.zhihu.com/p/414627975>

## 1. 在`~/.bashrc`中添加

```bash
# add for proxy
export hostip=$(ip route | grep default | awk '{print $3}')
export hostport=10809
alias proxy='
    export HTTPS_PROXY="http://${hostip}:${hostport}";
    export HTTP_PROXY="http://${hostip}:${hostport}";
    export ALL_PROXY="http://${hostip}:${hostport}";
    echo -e "Acquire::http::Proxy \"http://${hostip}:${hostport}\";" | sudo tee -a /etc/apt/apt.conf.d/proxy.conf > /dev/null;
    echo -e "Acquire::https::Proxy \"http://${hostip}:${hostport}\";" | sudo tee -a /etc/apt/apt.conf.d/proxy.conf > /dev/null;
'
alias unproxy='
    unset HTTPS_PROXY;
    unset HTTP_PROXY;
    unset ALL_PROXY;
    sudo sed -i -e '/Acquire::http::Proxy/d' /etc/apt/apt.conf.d/proxy.conf;
    sudo sed -i -e '/Acquire::https::Proxy/d' /etc/apt/apt.conf.d/proxy.conf;
'
```

## 2. 开启并验证

```bash
proxy
```

```bash
curl https://www.google.com
```
