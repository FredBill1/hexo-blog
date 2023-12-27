---
title: 动态开点线段树
date: 2023-12-02 23:52:12
tags:
  - 算法
  - 数据结构
  - 线段树
  - 动态开点线段树
  - 线段树分裂/合并
categories:
  - [算法, 数据结构]
---

# 动态开点线段树

## 1. 模板

{% contentbox "cpp &lt;dynamic_segtree&gt;" type:code %}

```cpp
#include <bits/stdc++.h>

template <class S, S (*op)(S, S), S (*e)()>
class dynamic_segtree {
    struct Node {
        S val;
        Node *left = nullptr, *right = nullptr;
        ~Node() { delete left, delete right; }
    };
    int _low, _high;
    Node* _root = nullptr;
    static Node* _build(const std::vector<S>& v, int s, int t) {
        Node* root = new Node();
        if (s == t) {
            root->val = v[s];
            return root;
        }
        int m = s + ((t - s) >> 1);
        root->left = _build(v, s, m);
        root->right = _build(v, m + 1, t);
        root->val = op(root->left->val, root->right->val);
        return root;
    }
    static void _set(Node*& root, int p, S x, int s, int t) {
        if (root == nullptr) root = new Node();
        if (s == t) {
            root->val = x;
            return;
        }
        int m = s + ((t - s) >> 1);
        if (p <= m) {
            _set(root->left, p, x, s, m);
        } else {
            _set(root->right, p, x, m + 1, t);
        }
        root->val = op(root->left ? root->left->val : e(), root->right ? root->right->val : e());
    }
    static S _get(const Node* root, int p, int s, int t) {
        if (root == nullptr) return e();
        if (s == t) return root->val;
        int m = s + ((t - s) >> 1);
        if (p <= m) return _get(root->left, p, s, m);
        return _get(root->right, p, m + 1, t);
    }
    static S _prod(const Node* root, int l, int r, int s, int t) {
        if (root == nullptr) return e();
        if (l <= s && t <= r) return root->val;
        int m = s + ((t - s) >> 1);
        S res = e();
        if (l <= m && root->left) res = _prod(root->left, l, r, s, m);
        if (r > m && root->right) res = op(res, _prod(root->right, l, r, m + 1, t));
        return res;
    }
    static void _merge(Node*& root, Node*& other, int s, int t) {
        if (root == nullptr || other == nullptr) {
            if (root == nullptr) root = other, other = nullptr;
            return;
        }
        if (s == t) {
            root->val = op(root->val, other->val);
            delete other;
            other = nullptr;
            return;
        }
        int m = s + ((t - s) >> 1);
        _merge(root->left, other->left, s, m);
        _merge(root->right, other->right, m + 1, t);
        root->val = op(root->left ? root->left->val : e(), root->right ? root->right->val : e());
        delete other;
        other = nullptr;
    }
    static void _split(Node*& old_root, Node*& new_root, int l, int r, int s, int t) {
        if (t < l || r < s || old_root == nullptr) return;
        if (l <= s && t <= r) {
            new_root = old_root;
            old_root = nullptr;
            return;
        }
        if (new_root == nullptr) new_root = new Node();
        int m = s + ((t - s) >> 1);
        if (l <= m) _split(old_root->left, new_root->left, l, r, s, m);
        if (r > m) _split(old_root->right, new_root->right, l, r, m + 1, t);
        old_root->val = op(old_root->left ? old_root->left->val : e(), old_root->right ? old_root->right->val : e());
        new_root->val = op(new_root->left ? new_root->left->val : e(), new_root->right ? new_root->right->val : e());
    }
    template <class F>
    static int _max_right(const Node* root, int l, F f, S& sm, int s, int t) {
        if (root == nullptr) return t;
        if (l == s)
            if (S nxt = op(sm, root->val); f(nxt)) return sm = nxt, t;
        if (s == t) return s - 1;
        int m = s + ((t - s) >> 1);
        if (l > m) return _max_right(root->right, l, f, sm, m + 1, t);
        int r = _max_right(root->left, l, f, sm, s, m);
        if (r < m) return r;
        return _max_right(root->right, m + 1, f, sm, m + 1, t);
    }
    template <class F>
    static int _min_left(const Node* root, int r, F f, S& sm, int s, int t) {
        if (root == nullptr) return s;
        if (r == t)
            if (S nxt = op(root->val, sm); f(nxt)) return sm = nxt, s;
        if (s == t) return t + 1;
        int m = s + ((t - s) >> 1);
        if (r <= m) return _min_left(root->left, r, f, sm, s, m);
        int l = _min_left(root->right, r, f, sm, m + 1, t);
        if (l > m + 1) return l;
        return _min_left(root->left, m, f, sm, s, m);
    }
    static Node* _clone(const Node* node) {
        if (node == nullptr) return nullptr;
        Node* ret = new Node();
        ret->val = node->val;
        ret->left = _clone(node->left);
        ret->right = _clone(node->right);
        return ret;
    }

   public:
    dynamic_segtree() : _low(0), _high(0) {}
    explicit dynamic_segtree(int low, int high) : _low(low), _high(high) {}
    explicit dynamic_segtree(const std::vector<S>& v) : _low(0), _high(int(v.size()) - 1) {
        _root = _build(v, _low, _high);
    }
    ~dynamic_segtree() { delete _root; }
    dynamic_segtree(const dynamic_segtree& other) : _low(other._low), _high(other._high) {
        _root = _clone(other._root);
    }
    dynamic_segtree(dynamic_segtree&& other) : _low(other._low), _high(other._high) {
        _root = other._root;
        other._root = nullptr;
    }
    dynamic_segtree& operator=(const dynamic_segtree& other) {
        if (this != &other) {
            delete _root;
            _low = other._low;
            _high = other._high;
            _root = _clone(other._root);
        }
        return *this;
    }
    dynamic_segtree& operator=(dynamic_segtree&& other) {
        if (this != &other) {
            delete _root;
            _low = other._low;
            _high = other._high;
            _root = other._root;
            other._root = nullptr;
        }
        return *this;
    }
    int size() const { return _high - _low + 1; }
    int low() const { return _low; }
    int high() const { return _high; }
    void set(int p, S x) {
        assert(_low <= p && p <= _high);
        _set(_root, p, x, _low, _high);
    }
    S get(int p) const {
        assert(_low <= p && p <= _high);
        return _get(_root, p, _low, _high);
    }
    S prod(int l, int r) const {
        assert(_low <= l && l <= r && r <= _high);
        return _prod(_root, l, r, _low, _high);
    }
    S all_prod() const { return _root ? _root->val : e(); }
    void merge(dynamic_segtree&& other) {
        _merge(_root, other._root, _low, _high);
        other._root = nullptr;
    }
    dynamic_segtree split(int l, int r) {
        assert(_low <= l && l <= r && r <= _high);
        Node* new_root = nullptr;
        _split(_root, new_root, l, r, _low, _high);
        dynamic_segtree ret(_low, _high);
        ret._root = new_root;
        return ret;
    }

    // r==l-1 or f(op(a[l],a[l+1],...,a[r])) = true
    // r==high or f(op(a[l],a[l+1],...,a[r+1])) = false
    template <bool (*f)(S)>
    int max_right(int l) const {
        return max_right(_root, l, [](S x) { return f(x); });
    }
    template <class F>
    int max_right(int l, F f) const {
        assert(_low <= l && l <= _high);
        assert(f(e()));
        S sm = e();
        return _max_right(_root, l, f, sm, _low, _high);
    }

    // l==r+1 or f(op(a[l],a[l+1],...,a[r])) = true
    // l==low or f(op(a[l-1],a[l],...,a[r])) = false
    template <bool (*f)(S)>
    int min_left(int r) const {
        return min_left(_root, r, [](S x) { return f(x); });
    }
    template <class F>
    int min_left(int r, F f) const {
        assert(_low <= r && r <= _high);
        assert(f(e()));
        S sm = e();
        return _min_left(_root, r, f, sm, _low, _high);
    }
};
```

{% endcontentbox %}

## 2. 例题

### 2.1 [洛谷P5494](https://www.luogu.com.cn/problem/P5494) 线段树分裂/合并

> 初始给一个编号为`1`的线段树
> 
> - `0 p x y`: 从编号为`p`的线段树分裂出区间`[x,y]`构成一棵新的线段树，编号为当前线段树数量+1
> - `1 p t`: 将编号为`t`的线段树合并入编号为`p`的线段树，保证编号为`t`的线段树不会再使用
> - `2 p x q`: 将编号为`p`的线段树的第`q`个数加上`x`
> - `3 p x y`: 查询编号为`p`的线段树的区间`[x,y]`的和
> - `4 p k`: 查询编号为`p`的线段树的第`k`小的数的位置，不存在则输出`-1`

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <dynamic_segtree>

using namespace std;
using ll = long long;
using S = ll;
S op(S a, S b) { return a + b; }
S e() { return 0; }
using segtree = dynamic_segtree<S, op, e>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<ll> a(N + 1);
    for (int i = 1; i <= N; ++i) cin >> a[i];
    vector<segtree> roots{{}, segtree(a)};
    while (M--) {
        int op;
        cin >> op;
        switch (op) {
            case 0: {
                int p, x, y;
                cin >> p >> x >> y;
                roots.emplace_back(roots[p].split(x, y));
            } break;
            case 1: {
                int p, t;
                cin >> p >> t;
                roots[p].merge(std::move(roots[t]));
            } break;
            case 2: {
                int p, x, q;
                cin >> p >> x >> q;
                auto& seg = roots[p];
                seg.set(q, seg.get(q) + x);
            } break;
            case 3: {
                int p, x, y;
                cin >> p >> x >> y;
                cout << roots[p].prod(x, y) << '\n';
            } break;
            case 4: {
                int p, k;
                cin >> p >> k;
                auto& seg = roots[p];
                int r = seg.max_right(1, [k](S x) { return x < k; });
                cout << (r == seg.high() ? -1 : r + 1) << '\n';
            } break;
        }
    }
}
```

{% endcontentbox %}
