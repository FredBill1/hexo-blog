---
title: ST表
date: 2023-11-29 19:20:04
tags:
  - 算法
  - 数据结构
  - ST表
categories:
  - [算法, 数据结构]
---

# ST表

> 参考：<https://github.com/the-tourist/algo>

## 1. 模板

{% contentbox "cpp &lt;SparseTable&gt;" type:code %}

```cpp
#include <cassert>
#include <functional>
#include <vector>

#ifdef _MSC_VER
#include <intrin.h>
#endif

int countl_zero(unsigned int n) {
#ifdef _MSC_VER
    unsigned long index;
    _BitScanReverse(&index, n);
    return 31 - index;
#else
    return __builtin_clz(n);
#endif
}

template <typename T, class F = std::function<T(const T&, const T&)>>
class SparseTable {
    int n;
    std::vector<std::vector<T>> mat;
    F func;

   public:
    SparseTable() = default;
    SparseTable(const SparseTable&) = default;
    SparseTable(SparseTable&&) = default;
    SparseTable& operator=(const SparseTable&) = default;
    SparseTable& operator=(SparseTable&&) = default;
    template <typename U>
    SparseTable(U&& a, const F& f) : func(f) {
        n = static_cast<int>(a.size());
        int max_log = 32 - countl_zero(n);
        mat.resize(max_log);
        mat[0] = std::forward<U>(a);
        for (int j = 1; j < max_log; j++) {
            mat[j].resize(n - (1 << j) + 1);
            for (int i = 0; i <= n - (1 << j); i++) mat[j][i] = func(mat[j - 1][i], mat[j - 1][i + (1 << (j - 1))]);
        }
    }

    T get(int from, int to) const {  // [from, to)
        assert(0 <= from && from < to && to <= n);
        int lg = 31 - countl_zero(to - from);
        return func(mat[lg][from], mat[lg][to - (1 << lg)]);
    }
};
```

{% endcontentbox %}

{% contentbox "python SparseTable.py" type:code %}

```python
from collections.abc import Callable
from typing import Generic, TypeVar

T = TypeVar("T")


class SparseTable(Generic[T]):
    def __init__(self, data: list[T], func: Callable[[T, T], T]) -> None:
        self.func = func
        self.st = st = [data]
        i, N = 1, len(st[0])
        while 2 * i <= N:
            pre = st[-1]
            st.append([func(pre[j], pre[j + i]) for j in range(N - 2 * i + 1)])
            i <<= 1

    def query(self, begin: int, end: int) -> T:  # [begin, end)
        assert 0 <= begin < end <= len(self.st[0])
        lg = (end - begin).bit_length() - 1
        return self.func(self.st[lg][begin], self.st[lg][end - (1 << lg)])
```

{% endcontentbox %}

## 2. 例题

### 2.1 [洛谷P3865](https://www.luogu.com.cn/problem/P3865) 查询区间最大值

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <SparseTable>

using namespace std;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<int> a(N);
    for (auto& x : a) cin >> x;
    SparseTable<int> st(std::move(a), [](int x, int y) { return max(x, y); });
    while (M--) {
        int l, r;
        cin >> l >> r;
        cout << st.get(l - 1, r) << '\n';
    }
}
```

{% endcontentbox %}

{% contentbox "python" type:code %}

```python
from SparseTable import SparseTable

N, M = map(int, input().split())
a = [int(v) for v in input().split()]
st = SparseTable(a, max)
for _ in range(M):
    l, r = map(int, input().split())
    print(st.query(l - 1, r))
```

{% endcontentbox %}
