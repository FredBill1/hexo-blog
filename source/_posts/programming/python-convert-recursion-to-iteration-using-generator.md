---
title: 在Python中使用generator将递归转换为迭代
date: 2025-02-08 21:39:12
tags:
  - python
categories:
  - 编程
---

# 在Python中使用generator将递归转换为迭代

{% contentbox python trampoline.py type:code %}

```python
def trampoline(f, stack=[]):
    def wrapped(*args, **kwargs):
        if stack:
            return f(*args, **kwargs)
        stack.append(f(*args, **kwargs))
        val = None
        while stack:
            try:
                stack.append(stack[-1].send(val))
                val = None
            except StopIteration as e:
                stack.pop()
                val = e.value
        return val

    return wrapped


if __name__ == "__main__":

    @trampoline
    def fib(x: int):
        if x <= 1:
            return 1
        return (yield fib(x - 1)) + (yield fib(x - 2))

    @trampoline
    def is_odd(x: int):
        if x == 0:
            return False
        return (yield is_even(x - 1))

    @trampoline
    def is_even(x: int):
        if x == 0:
            return True
        return (yield is_odd(x - 1))

    @trampoline
    def factorial(x: int):
        if x == 0:
            return 1
        return (yield factorial(x - 1)) * x % (int(1e9) + 7)

    print(fib(10))
    print(is_odd(100000))
    print(is_even(100000))
    print(factorial(100000))
```

{% endcontentbox %}

以及[pajenegod](https://codeforces.com/profile/pajenegod)的[另一种写法](https://codeforces.com/blog/entry/80158?#comment-662130)：

{% contentbox python bootstrap.py type:code %}

```python
from types import GeneratorType


def bootstrap(f, stack=[]):
    def wrappedfunc(*args, **kwargs):
        if stack:
            return f(*args, **kwargs)
        else:
            to = f(*args, **kwargs)
            while True:
                if isinstance(to, GeneratorType):
                    stack.append(to)
                    to = next(to)
                else:
                    stack.pop()
                    if not stack:
                        break
                    to = stack[-1].send(to)
            return to

    return wrappedfunc


if __name__ == "__main__":

    @bootstrap
    def fib(x: int):
        if x <= 1:
            yield 1
        yield (yield fib(x - 1)) + (yield fib(x - 2))

    @bootstrap
    def is_odd(x: int):
        if x == 0:
            yield False
        yield (yield is_even(x - 1))

    @bootstrap
    def is_even(x: int):
        if x == 0:
            yield True
        yield (yield is_odd(x - 1))

    @bootstrap
    def factorial(x: int):
        if x == 0:
            yield 1
        yield (yield factorial(x - 1)) * x % (int(1e9) + 7)

    print(fib(10))
    print(is_odd(100000))
    print(is_even(100000))
    print(factorial(100000))
```

{% endcontentbox %}
