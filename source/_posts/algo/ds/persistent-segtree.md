---
title: 可持久化线段树
date: 2023-12-01 23:08:53
tags:
  - 算法
  - 数据结构
  - 线段树
  - 可持久化线段树
  - 主席树
  - 并查集
  - 可持久化并查集
  - 权值数组
categories:
  - [算法, 数据结构]
---

# 可持久化线段树

## 1. 模板

{% contentbox "cpp &lt;persistent_segtree&gt;" type:code %}

```cpp
#include <cassert>
#include <deque>
#include <functional>
#include <vector>

#if __cplusplus >= 201703L

template <class S, auto op, auto e>
class persistent_segtree {
    static_assert(std::is_convertible_v<decltype(op), std::function<S(S, S)>>, "op must work as S(S, S)");
    static_assert(std::is_convertible_v<decltype(e), std::function<S()>>, "e must work as S()");

#else

template <class S, S (*op)(S, S), S (*e)()>
class persistent_segtree {

#endif
   public:
    struct Node {
        S val;
        const Node *left, *right;
    };
    using p_node = const Node*;

   private:
    std::deque<Node> _nodes;  // deque保证在push_back时不会使指针失效
    int _n;
    p_node _root;
    p_node _build(const std::vector<S>& v, int s, int t) {
        // 对 [s,t] 区间建立线段树
        Node& node = _nodes.emplace_back();
        if (s == t) {
            node.val = v[s];
            node.left = node.right = nullptr;
            return &node;
        }
        int m = s + ((t - s) >> 1);
        node.left = _build(v, s, m);
        node.right = _build(v, m + 1, t);
        node.val = op(node.left->val, node.right->val);
        return &node;
    }
    p_node _set(p_node root, int p, S x, int s, int t) {
        Node& node = _nodes.emplace_back(*root);
        if (s == t) {
            node.val = x;
            return &node;
        }
        int m = s + ((t - s) >> 1);
        if (p <= m) {
            node.left = _set(root->left, p, x, s, m);
        } else {
            node.right = _set(root->right, p, x, m + 1, t);
        }
        node.val = op(node.left->val, node.right->val);
        return &node;
    }
    S _get(p_node root, int p, int s, int t) const {
        if (s == t) return root->val;
        int m = s + ((t - s) >> 1);
        if (p <= m) return _get(root->left, p, s, m);
        return _get(root->right, p, m + 1, t);
    }
    S _prod(p_node root, int l, int r, int s, int t) const {
        if (l <= s && t <= r) return root->val;
        int m = s + ((t - s) >> 1);
        S res = e();
        if (l <= m) res = _prod(root->left, l, r, s, m);
        if (r > m) res = op(res, _prod(root->right, l, r, m + 1, t));
        return res;
    }

   public:
    explicit persistent_segtree(int n) : persistent_segtree(std::vector<S>(n, e())) {}
    explicit persistent_segtree(const std::vector<S>& v) : _n(int(v.size())) { _root = _build(v, 0, _n - 1); }
    int size() const { return _n; }
    p_node root() const { return _root; }
    p_node set(p_node root, int p, S x) {
        assert(0 <= p && p < _n);
        return _set(root, p, x, 0, _n - 1);
    }
    S get(p_node root, int p) const {
        assert(0 <= p && p < _n);
        return _get(root, p, 0, _n - 1);
    }
    S prod(p_node root, int l, int r) const {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return e();
        return _prod(root, l, r - 1, 0, _n - 1);
    }
    S all_prod(p_node root) const { return root->val; }
};
```

{% endcontentbox %}

另有一个直接用`new`实现节点分配，接口更清晰，但是会TLE(可以通过自定义new预分配内存来解决)的模板：

{% contentbox "cpp &lt;persistent_segtree&gt;" type:code %}

```cpp
template <class S, S (*op)(S, S), S (*e)(), S (*diff)(S, S) = nullptr>
class persistent_segtree {
    struct Node {
        S val;
        mutable int ref_cnt;
        const Node *left, *right;
        ~Node() {
            if (left != nullptr && !--left->ref_cnt) delete left;
            if (right != nullptr && !--right->ref_cnt) delete right;
        }
    };

    int _n;
    const Node *_root, *_other;
    static const Node* _build(const std::vector<S>& v, int s, int t) {
        // 对 [s,t] 区间建立线段树
        Node* node = new Node;
        node->ref_cnt = 1;
        if (s == t) {
            node->val = v[s];
            node->left = node->right = nullptr;
            return node;
        }
        int m = s + ((t - s) >> 1);
        node->left = _build(v, s, m);
        node->right = _build(v, m + 1, t);
        node->val = op(node->left->val, node->right->val);
        return node;
    }
    static const Node* _set(const Node* root, int p, S x, int s, int t) {
        Node* node = new Node;
        node->ref_cnt = 1;
        if (s == t) {
            node->val = x;
            node->left = node->right = nullptr;
            return node;
        }
        int m = s + ((t - s) >> 1);
        if (p <= m) {
            node->left = _set(root->left, p, x, s, m);
            node->right = root->right, ++node->right->ref_cnt;
        } else {
            node->left = root->left, ++node->left->ref_cnt;
            node->right = _set(root->right, p, x, m + 1, t);
        }
        node->val = op(node->left->val, node->right->val);
        return node;
    }
    static S _get(const Node* root, const Node* other, int p, int s, int t) {
        if (s == t) return other == nullptr ? root->val : diff(root->val, other->val);
        int m = s + ((t - s) >> 1);
        if (p <= m) return _get(root->left, other == nullptr ? nullptr : other->left, p, s, m);
        return _get(root->right, other == nullptr ? nullptr : other->right, p, m + 1, t);
    }
    static S _prod(const Node* root, const Node* other, int l, int r, int s, int t) {
        if (l <= s && t <= r) return other == nullptr ? root->val : diff(root->val, other->val);
        int m = s + ((t - s) >> 1);
        S res = e();
        if (l <= m) res = _prod(root->left, other == nullptr ? nullptr : other->left, l, r, s, m);
        if (r > m) res = op(res, _prod(root->right, other == nullptr ? nullptr : other->right, l, r, m + 1, t));
        return res;
    }
    template <class F>
    static int _max_right(const Node* root, const Node* other, int l, F f, S& sm, int s, int t) {
        if (l == s)
            if (S nxt = op(sm, other == nullptr ? root->val : diff(root->val, other->val)); f(nxt)) return sm = nxt, t;
        if (s == t) return s - 1;
        int m = s + ((t - s) >> 1);
        if (l > m) return _max_right(root->right, other == nullptr ? nullptr : other->right, l, f, sm, m + 1, t);
        int r = _max_right(root->left, other == nullptr ? nullptr : other->left, l, f, sm, s, m);
        if (r < m) return r;
        return _max_right(root->right, other == nullptr ? nullptr : other->right, m + 1, f, sm, m + 1, t);
    }
    template <class F>
    static int _min_left(const Node* root, const Node* other, int r, F f, S& sm, int s, int t) {
        if (r == t)
            if (S nxt = op(other == nullptr ? root->val : diff(root->val, other->val), sm); f(nxt)) return sm = nxt, s;
        if (s == t) return t + 1;
        int m = s + ((t - s) >> 1);
        if (r <= m) return _min_left(root->left, other == nullptr ? nullptr : other->left, r, f, sm, s, m);
        int l = _min_left(root->right, other == nullptr ? nullptr : other->right, r, f, sm, m + 1, t);
        if (l > m + 1) return l;
        return _min_left(root->left, other == nullptr ? nullptr : other->left, m, f, sm, s, m);
    }

    explicit persistent_segtree(int n, const Node* root, const Node* other = nullptr)
        : _n(n), _root(root), _other(other) {}

   public:
    persistent_segtree() : persistent_segtree(0, nullptr) {}
    explicit persistent_segtree(int n) : persistent_segtree(std::vector<S>(n, e())) {}
    explicit persistent_segtree(const std::vector<S>& v)
        : persistent_segtree(v.size(), v.size() ? _build(v, 0, v.size() - 1) : nullptr) {}
    persistent_segtree(persistent_segtree&& rhs) noexcept : persistent_segtree(rhs._n, rhs._root) {
        rhs._root = nullptr;
    }
    persistent_segtree& operator=(persistent_segtree&& rhs) noexcept {
        if (this != &rhs) {
            _n = rhs._n;
            _root = rhs._root;
            rhs._root = nullptr;
        }
        return *this;
    }
    persistent_segtree(const persistent_segtree& rhs) : persistent_segtree(rhs._n, rhs._root) { ++_root->ref_cnt; }
    persistent_segtree& operator=(const persistent_segtree& rhs) {
        if (this != &rhs) {
            if (_root != nullptr && !--_root->ref_cnt) delete _root;
            _n = rhs._n;
            _root = rhs._root;
            ++_root->ref_cnt;
        }
        return *this;
    }
    ~persistent_segtree() {
        if (_root != nullptr && !--_root->ref_cnt) delete _root;
        if (_other != nullptr && !--_other->ref_cnt) delete _other;
    }
    int size() const { return _n; }
    persistent_segtree set(int p, S x) {
        assert(_other == nullptr);
        assert(0 <= p && p < _n);
        return persistent_segtree(_n, _set(_root, p, x, 0, _n - 1));
    }
    S get(int p) const {
        assert(0 <= p && p < _n);
        return _get(_root, _other, p, 0, _n - 1);
    }
    S prod(int l, int r) const {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return e();
        return _prod(_root, _other, l, r - 1, 0, _n - 1);
    }
    persistent_segtree operator-(const persistent_segtree& other) const {
        static_assert(diff != nullptr, "Must specify diff function");
        assert(_other == nullptr && other._other == nullptr);
        assert(_n == other._n);
        ++_root->ref_cnt, ++other._root->ref_cnt;
        return persistent_segtree(_n, _root, other._root);
    }
    S all_prod() const {
        assert(_root != nullptr);
        return _other == nullptr ? _root->val : diff(_root->val, _other->val);
    }
    // r==l-1 or f(op(a[l],a[l+1],...,a[r])) = true
    // r==high or f(op(a[l],a[l+1],...,a[r+1])) = false
    template <bool (*f)(S)>
    int max_right(int l) const {
        return max_right(_root, l, [](S x) { return f(x); });
    }
    template <class F>
    int max_right(int l, F f) const {
        assert(0 <= l && l < _n);
        assert(f(e()));
        S sm = e();
        return _max_right(_root, _other, l, f, sm, 0, _n - 1);
    }

    // l==r+1 or f(op(a[l],a[l+1],...,a[r])) = true
    // l==low or f(op(a[l-1],a[l],...,a[r])) = false
    template <bool (*f)(S)>
    int min_left(int r) const {
        return min_left(_root, r, [](S x) { return f(x); });
    }
    template <class F>
    int min_left(int r, F f) const {
        assert(0 <= r && r < _n);
        assert(f(e()));
        S sm = e();
        return _min_left(_root, _other, r, f, sm, 0, _n - 1);
    }
};
```

{% endcontentbox %}

{% contentbox "cpp &lt;persistent_segtree&gt;" type:code %}

```cpp
template <class S, S (*op)(S, S), S (*e)(), S (*diff)(S, S) = nullptr>
class persistent_segtree {
    struct Node {
        S val;
        const Node *left, *right;
    };

    static inline Node node_pool[int(1e6)];
    static inline int node_cnt = 0;
    static Node* create_node() { return &node_pool[node_cnt++]; }

    int _n;
    const Node *_root, *_other;
    static const Node* _build(const std::vector<S>& v, int s, int t) {
        // 对 [s,t] 区间建立线段树
        Node* node = create_node();
        if (s == t) {
            node->val = v[s];
            node->left = node->right = nullptr;
            return node;
        }
        int m = s + ((t - s) >> 1);
        node->left = _build(v, s, m);
        node->right = _build(v, m + 1, t);
        node->val = op(node->left->val, node->right->val);
        return node;
    }
    static const Node* _set(const Node* root, int p, S x, int s, int t) {
        Node* node = create_node();
        if (s == t) {
            node->val = x;
            node->left = node->right = nullptr;
            return node;
        }
        int m = s + ((t - s) >> 1);
        if (p <= m) {
            node->left = _set(root->left, p, x, s, m);
            node->right = root->right;
        } else {
            node->left = root->left;
            node->right = _set(root->right, p, x, m + 1, t);
        }
        node->val = op(node->left->val, node->right->val);
        return node;
    }
    static S _get(const Node* root, const Node* other, int p, int s, int t) {
        if (s == t) return other == nullptr ? root->val : diff(root->val, other->val);
        int m = s + ((t - s) >> 1);
        if (p <= m) return _get(root->left, other == nullptr ? nullptr : other->left, p, s, m);
        return _get(root->right, other == nullptr ? nullptr : other->right, p, m + 1, t);
    }
    static S _prod(const Node* root, const Node* other, int l, int r, int s, int t) {
        if (l <= s && t <= r) return other == nullptr ? root->val : diff(root->val, other->val);
        int m = s + ((t - s) >> 1);
        S res = e();
        if (l <= m) res = _prod(root->left, other == nullptr ? nullptr : other->left, l, r, s, m);
        if (r > m) res = op(res, _prod(root->right, other == nullptr ? nullptr : other->right, l, r, m + 1, t));
        return res;
    }
    template <class F>
    static int _max_right(const Node* root, const Node* other, int l, F f, S& sm, int s, int t) {
        if (l == s)
            if (S nxt = op(sm, other == nullptr ? root->val : diff(root->val, other->val)); f(nxt)) return sm = nxt, t;
        if (s == t) return s - 1;
        int m = s + ((t - s) >> 1);
        if (l > m) return _max_right(root->right, other == nullptr ? nullptr : other->right, l, f, sm, m + 1, t);
        int r = _max_right(root->left, other == nullptr ? nullptr : other->left, l, f, sm, s, m);
        if (r < m) return r;
        return _max_right(root->right, other == nullptr ? nullptr : other->right, m + 1, f, sm, m + 1, t);
    }
    template <class F>
    static int _min_left(const Node* root, const Node* other, int r, F f, S& sm, int s, int t) {
        if (r == t)
            if (S nxt = op(other == nullptr ? root->val : diff(root->val, other->val), sm); f(nxt)) return sm = nxt, s;
        if (s == t) return t + 1;
        int m = s + ((t - s) >> 1);
        if (r <= m) return _min_left(root->left, other == nullptr ? nullptr : other->left, r, f, sm, s, m);
        int l = _min_left(root->right, other == nullptr ? nullptr : other->right, r, f, sm, m + 1, t);
        if (l > m + 1) return l;
        return _min_left(root->left, other == nullptr ? nullptr : other->left, m, f, sm, s, m);
    }

    explicit persistent_segtree(int n, const Node* root, const Node* other = nullptr)
        : _n(n), _root(root), _other(other) {}

   public:
    persistent_segtree() : persistent_segtree(0, nullptr) {}
    explicit persistent_segtree(int n) : persistent_segtree(std::vector<S>(n, e())) {}
    explicit persistent_segtree(const std::vector<S>& v)
        : persistent_segtree(v.size(), v.size() ? _build(v, 0, v.size() - 1) : nullptr) {}
    persistent_segtree(persistent_segtree&& rhs) noexcept : persistent_segtree(rhs._n, rhs._root) {
        rhs._root = nullptr;
    }
    persistent_segtree& operator=(persistent_segtree&& rhs) noexcept {
        if (this != &rhs) {
            _n = rhs._n;
            _root = rhs._root;
            rhs._root = nullptr;
        }
        return *this;
    }
    persistent_segtree(const persistent_segtree& rhs) : persistent_segtree(rhs._n, rhs._root) {}
    persistent_segtree& operator=(const persistent_segtree& rhs) {
        if (this != &rhs) {
            _n = rhs._n;
            _root = rhs._root;
            ++_root->ref_cnt;
        }
        return *this;
    }
    int size() const { return _n; }
    persistent_segtree set(int p, S x) {
        assert(_other == nullptr);
        assert(0 <= p && p < _n);
        return persistent_segtree(_n, _set(_root, p, x, 0, _n - 1));
    }
    S get(int p) const {
        assert(0 <= p && p < _n);
        return _get(_root, _other, p, 0, _n - 1);
    }
    S prod(int l, int r) const {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return e();
        return _prod(_root, _other, l, r - 1, 0, _n - 1);
    }
    persistent_segtree operator-(const persistent_segtree& other) const {
        static_assert(diff != nullptr, "Must specify diff function");
        assert(_other == nullptr && other._other == nullptr);
        assert(_n == other._n);
        return persistent_segtree(_n, _root, other._root);
    }
    S all_prod() const {
        assert(_root != nullptr);
        return _other == nullptr ? _root->val : diff(_root->val, _other->val);
    }
    // r==l-1 or f(op(a[l],a[l+1],...,a[r])) = true
    // r==high or f(op(a[l],a[l+1],...,a[r+1])) = false
    template <bool (*f)(S)>
    int max_right(int l) const {
        return max_right(_root, l, [](S x) { return f(x); });
    }
    template <class F>
    int max_right(int l, F f) const {
        assert(0 <= l && l < _n);
        assert(f(e()));
        S sm = e();
        return _max_right(_root, _other, l, f, sm, 0, _n - 1);
    }

    // l==r+1 or f(op(a[l],a[l+1],...,a[r])) = true
    // l==low or f(op(a[l-1],a[l],...,a[r])) = false
    template <bool (*f)(S)>
    int min_left(int r) const {
        return min_left(_root, r, [](S x) { return f(x); });
    }
    template <class F>
    int min_left(int r, F f) const {
        assert(0 <= r && r < _n);
        assert(f(e()));
        S sm = e();
        return _min_left(_root, _other, r, f, sm, 0, _n - 1);
    }

    static void reset_node_cnt() { node_cnt = 0; }
};
```

{% endcontentbox %}

## 2. 例题

### 2.1 [洛谷P3919](https://www.luogu.com.cn/problem/P3919) 单点修改，单点查询

> - `v 1 p x`：将第`v`个操作后的数组的第`p`个数修改为`x`
> - `v 2 p`：输出第`v`个操作后的数组的第`p`个数

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <persistent_segtree>

using namespace std;
// S : 幺半群内元素的定义
using S = int;

// vvv 因为只需要查询单点，所以不需要维护区间和 vvv
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) { return 0; }
// e: 单位元
S e() { return 0; }

using segtree = persistent_segtree<S, op, e>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<int> a(N);
    for (auto& x : a) cin >> x;
    segtree seg(a);
    vector<segtree::p_node> versions(M + 1);
    versions[0] = seg.root();
    for (int i = 1; i <= M; ++i) {
        int v, op, p, k;
        cin >> v >> op >> p;
        if (op == 1) {
            cin >> k;
            versions[i] = seg.set(versions[v], p - 1, k);
        } else {
            versions[i] = versions[v];
            cout << seg.get(versions[v], p - 1) << "\n";
        }
    }
}
```

{% endcontentbox %}

### 2.2 [洛谷P3834](https://www.luogu.com.cn/problem/P3834) 查询区间`[l,r]`中的第`k`小

根据知乎问题[「主席树」和「可持久化线段树」有什么区别？](https://www.zhihu.com/question/59195374/answer/2744661969)的回答，对序列每个前缀建立可持久化线段树的方法被称为主席树。

> - `l r k`: 查询区间`[l,r]`中的第`k`小

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <persistent_segtree>

using namespace std;
// S : 幺半群内元素的定义
using S = int;
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) { return a + b; }
// e: 单位元
S e() { return 0; }

using segtree = persistent_segtree<S, op, e>;

// 由于这个主席树是按离散化后的值建立的，所以可以把它当成一个关于值域区间的二叉搜索树
S query(segtree::p_node left_root, segtree::p_node right_root, int s, int t, int k) {
    if (s == t) return s;
    int m = s + ((t - s) >> 1);
    // 用加入到r时线段树的版本逐节点减去加入到l-1时的版本，可以得到在添加区间[l,r]
    // 的元素时线段树中每个节点所代表的值域区间中元素个数的变化
    // x = 左子节点中包含在[l,r]中的元素个数
    S x = right_root->left->val - left_root->left->val;
    // 如果k<=x，说明第k小的元素在左子节点代表的值域区间中
    if (k <= x) return query(left_root->left, right_root->left, s, m, k);
    // 否则第k小的元素在右子节点代表的值域区间中
    return query(left_root->right, right_root->right, m + 1, t, k - x);
}

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<int> a(N);
    for (auto& x : a) cin >> x;

    // 离散化
    auto discrete(a);
    sort(discrete.begin(), discrete.end()), discrete.erase(unique(discrete.begin(), discrete.end()), discrete.end());
    auto get_id = [&](int x) { return lower_bound(discrete.begin(), discrete.end(), x) - discrete.begin(); };

    // 用可持久化线段树维护从左到右加入新元素时，每段值域区间中元素个数的变化
    segtree seg(discrete.size());
    vector<segtree::p_node> roots;
    roots.reserve(N + 1);
    roots.push_back(seg.root());
    for (int i = 0; i < N; ++i) {
        int id = get_id(a[i]);  // 离散化后的值
        segtree::p_node last = roots.back();
        // 让这个元素的计数加一，同时线段树中值域区间包含这个元素的所有节点的计数也都会加一
        roots.push_back(seg.set(last, id, seg.get(last, id) + 1));
    }
    while (M--) {
        int l, r, k;
        cin >> l >> r >> k;
        cout << discrete[query(roots[l - 1], roots[r], 0, seg.size() - 1, k)] << '\n';
    }
}
```

{% endcontentbox %}

以及另一个用`new`实现节点分配的模板：

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <persistent_segtree>
using namespace std;
// S : 幺半群内元素的定义
using S = int;
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) { return a + b; }
// e: 单位元
S e() { return 0; }
S diff(S a, S b) { return a - b; }
using segtree = persistent_segtree<S, op, e, diff>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<int> a(N);
    for (auto& x : a) cin >> x;

    // 离散化
    auto discrete(a);
    sort(discrete.begin(), discrete.end()), discrete.erase(unique(discrete.begin(), discrete.end()), discrete.end());
    auto get_id = [&](int x) { return lower_bound(discrete.begin(), discrete.end(), x) - discrete.begin(); };

    // 用可持久化线段树维护从左到右加入新元素时，每段值域区间中元素个数的变化
    vector<segtree> versions;
    versions.reserve(N + 1);
    versions.emplace_back(int(discrete.size()));
    for (int i = 0; i < N; ++i) {
        int id = get_id(a[i]);  // 离散化后的值
        auto& last = versions.back();
        // 让这个元素的计数加一，同时线段树中值域区间包含这个元素的所有节点的计数也都会加一
        versions.emplace_back(last.set(id, last.get(id) + 1));
    }
    while (M--) {
        int l, r, k;
        cin >> l >> r >> k;
        auto seg = versions[r] - versions[l - 1];
        // 第k小 = 权值数组前缀和从左往右第一个>=k的位置 = 权值数组前缀和<k的最大的位置+1
        cout << discrete[seg.max_right(0, [k](S cnt) { return cnt < k; }) + 1] << '\n';
    }
}
```

{% endcontentbox %}

### 2.3 [CF1923E](https://codeforces.com/contest/1923/problem/E) 统计树中颜色相同的点对数

虽然不是正解，但还是放这了

{% post_link programming/y-combinator-in-cpp 'y_combinator的模板' %}

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <persistent_segtree>
#include <y_combinator>
#define rep(i, s, e) for (auto i = (s); i <= (e); ++i)
using namespace std;

using S = int;
S op(S a, S b) { return a + b; }
S e() { return 0; }
S diff(S a, S b) { return a - b; }
using segtree = persistent_segtree<S, op, e, diff>;

using ll = long long;
ll solve() {
    int N;
    cin >> N;
    vector<int> c(N + 1);
    vector<vector<int>> G(N + 1);
    rep(i, 1, N) cin >> c[i];
    rep(i, 2, N) {
        int u, v;
        cin >> u >> v;
        G[u].push_back(v), G[v].push_back(u);
    }

    vector<segtree> segs{segtree(N + 1)};
    segs.reserve(2 * N + 1);
    ll res = 0;
    y_combinator([&](auto dfs, int u, int pre) -> void {
        int cnt = segs.back().get(c[u]) + 1;
        segs.emplace_back(segs.back().set(c[u], cnt));
        for (int v : G[u]) {
            if (v == pre) continue;
            const auto& seg = segs.back();
            dfs(v, u);
            ll cnt = (segs.back() - seg).get(c[u]);
            res += cnt * (cnt - 1) / 2 + cnt;
        }
        segs.emplace_back(segs.back().set(c[u], cnt));
    })(1, 0);
    rep(i, 1, N) {
        ll cnt = segs.back().get(i);
        res += cnt * (cnt - 1) / 2;
    }
    return res;
}

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int T;
    cin >> T;
    while (T--) cout << solve() << '\n';
    return 0;
}
```

{% endcontentbox %}

### 2.4 [洛谷P3402](https://www.luogu.com.cn/problem/P3402) 可持久化并查集

> - `1 a b` 合并`a,b`所在集合；
> - `2 k` 回到第`k`次操作（执行三种操作中的任意一种都记为一次操作）之后的状态；
> - `3 a b` 询问`a,b`是否属于同一集合，如果是则输出`1`，否则输出`0`

用可持久化数组保存父结点的信息。无法路径压缩，但是可以按秩合并。

{% contentbox "cpp &lt;persistent_dsu&gt;" type:code %}

```cpp
#include <persistent_segtree>

class persistent_dsu {
    static int e() { return -1; }
    static int op(int a, int b) { return e(); }
    using segtree = persistent_segtree<int, op, e>;
    segtree seg;  // >=0代表父结点，<0代表秩

   public:
    explicit persistent_dsu(int n) : seg(n) {}
    using p_node = segtree::p_node;
    p_node root() const { return seg.root(); }
    std::pair<int, int> leader(p_node root, int a) const {
        assert(0 <= a && a < seg.size());
        for (;;) {
            int b = seg.get(root, a);
            if (b < 0) return {a, -b};
            a = b;
        }
    }
    bool same(p_node root, int a, int b) const {
        assert(0 <= a && a < seg.size());
        assert(0 <= b && b < seg.size());
        return leader(root, a) == leader(root, b);
    }
    p_node merge(p_node root, int a, int b) {
        assert(0 <= a && a < seg.size());
        assert(0 <= b && b < seg.size());
        auto [leader_a, rank_a] = leader(root, a);
        auto [leader_b, rank_b] = leader(root, b);
        if (a == b) return root;
        if (rank_a > rank_b) std::swap(leader_a, leader_b), std::swap(rank_a, rank_b);
        root = seg.set(root, leader_a, leader_b);
        if (rank_a == rank_b) root = seg.set(root, leader_b, -rank_b - 1);
        return root;
    }
};
```

{% endcontentbox %}

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <persistent_dsu>

using namespace std;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    persistent_dsu dsu(N + 1);
    vector<persistent_dsu::p_node> roots(M + 1);
    roots[0] = dsu.root();
    for (int i = 1; i <= M; ++i) {
        auto& root = roots[i] = roots[i - 1];
        int op, a, b;
        cin >> op;
        switch (op) {
            case 1: {
                cin >> a >> b;
                root = dsu.merge(root, a, b);
            } break;
            case 2: {
                cin >> a;
                root = roots[a];
            } break;
            case 3: {
                cin >> a >> b;
                cout << (dsu.same(root, a, b) ? "1" : "0") << '\n';
            } break;
        }
    }
}
```

{% endcontentbox %}

以及另一个用`new`实现节点分配的模板：

{% contentbox "cpp &lt;persistent_dsu&gt;" type:code %}

```cpp
class persistent_dsu {
    static int e() { return -1; }
    static int op(int a, int b) { return e(); }
    using segtree = persistent_segtree<int, op, e>;
    segtree seg;  // >=0代表父结点，<0代表秩
    void _merge(int a, int b) {
        auto [leader_a, rank_a] = leader(a);
        auto [leader_b, rank_b] = leader(b);
        if (a == b) return;
        if (rank_a > rank_b) std::swap(leader_a, leader_b), std::swap(rank_a, rank_b);
        seg = seg.set(leader_a, leader_b);
        if (rank_a == rank_b) seg = seg.set(leader_b, -rank_b - 1);
    }

   public:
    persistent_dsu() : seg() {}
    explicit persistent_dsu(int n) : seg(n) {}
    persistent_dsu(const persistent_dsu& rhs) = default;
    persistent_dsu& operator=(const persistent_dsu& rhs) = default;
    persistent_dsu(persistent_dsu&& rhs) = default;
    persistent_dsu& operator=(persistent_dsu&& rhs) = default;
    std::pair<int, int> leader(int a) const {
        assert(0 <= a && a < seg.size());
        for (;;) {
            int b = seg.get(a);
            if (b < 0) return {a, -b};
            a = b;
        }
    }
    bool same(int a, int b) const {
        assert(0 <= a && a < seg.size());
        assert(0 <= b && b < seg.size());
        return leader(a) == leader(b);
    }
    persistent_dsu merge(int a, int b) const {
        assert(0 <= a && a < seg.size());
        assert(0 <= b && b < seg.size());
        persistent_dsu res(*this);
        res._merge(a, b);
        return res;
    }
};
```

{% endcontentbox %}

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <persistent_dsu>
using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    persistent_dsu dsu(N + 1);
    vector<persistent_dsu> roots(M + 1);
    roots[0] = persistent_dsu(N + 1);
    for (int i = 1; i <= M; ++i) {
        auto& root = roots[i] = roots[i - 1];
        int op, a, b;
        cin >> op;
        switch (op) {
            case 1: {
                cin >> a >> b;
                root = root.merge(a, b);
            } break;
            case 2: {
                cin >> a;
                root = roots[a];
            } break;
            case 3: {
                cin >> a >> b;
                cout << (root.same(a, b) ? "1" : "0") << '\n';
            } break;
        }
    }
}
```

{% endcontentbox %}
