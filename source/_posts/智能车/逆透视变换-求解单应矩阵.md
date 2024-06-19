---
title: 逆透视变换-求解单应矩阵
date: 2023-12-22 23:23:21
tags:
  - 智能车
categories:
  - [智能车]
---

# 逆透视变换-求解单应矩阵

> 参考：<https://github.com/AprilRobotics/apriltag>

## 1. 模板

{% contentbox "c" type:code %}

```c
#include <math.h>
#include <stdbool.h>

// 求解从平面1到平面2的单应矩阵H, 将结果存入dst
// 求解失败(例如存在三点共线)则返回false
// c的前两列为4个特征点在平面1上的坐标，后两列为在平面2上的坐标
bool homography_compute(float dst[3][3], const float c[4][4]) {
    // 因为H有8个自由度，所以可以用四组坐标点建立一个8元一次线性方程组
    // clang-format off
    float A[] = {
        c[0][0], c[0][1], 1,       0,       0, 0, -c[0][0]*c[0][2], -c[0][1]*c[0][2], c[0][2],
              0,       0, 0, c[0][0], c[0][1], 1, -c[0][0]*c[0][3], -c[0][1]*c[0][3], c[0][3],
        c[1][0], c[1][1], 1,       0,       0, 0, -c[1][0]*c[1][2], -c[1][1]*c[1][2], c[1][2],
              0,       0, 0, c[1][0], c[1][1], 1, -c[1][0]*c[1][3], -c[1][1]*c[1][3], c[1][3],
        c[2][0], c[2][1], 1,       0,       0, 0, -c[2][0]*c[2][2], -c[2][1]*c[2][2], c[2][2],
              0,       0, 0, c[2][0], c[2][1], 1, -c[2][0]*c[2][3], -c[2][1]*c[2][3], c[2][3],
        c[3][0], c[3][1], 1,       0,       0, 0, -c[3][0]*c[3][2], -c[3][1]*c[3][2], c[3][2],
              0,       0, 0, c[3][0], c[3][1], 1, -c[3][0]*c[3][3], -c[3][1]*c[3][3], c[3][3],
    };
    // clang-format on

    // vvv 高斯消元法 vvv
    // Eliminate.
    for (int col = 0; col < 8; col++) {
        // Find best row to swap with.
        float max_val = 0;
        int max_val_idx = -1;
        for (int row = col; row < 8; row++) {
            float val = fabsf(A[row * 9 + col]);
            if (val > max_val) {
                max_val = val;
                max_val_idx = row;
            }
        }

        // Matrix is singular
        if (max_val < 1e-10) return false;

        // Swap to get best row.
        if (max_val_idx != col) {
            for (int i = col; i < 9; i++) {
                float tmp = A[col * 9 + i];
                A[col * 9 + i] = A[max_val_idx * 9 + i];
                A[max_val_idx * 9 + i] = tmp;
            }
        }

        // Do eliminate.
        for (int i = col + 1; i < 8; i++) {
            float f = A[i * 9 + col] / A[col * 9 + col];
            A[i * 9 + col] = 0;
            for (int j = col + 1; j < 9; j++) A[i * 9 + j] -= f * A[col * 9 + j];
        }
    }

    // Back solve.
    for (int col = 7; col >= 0; col--) {
        float sum = 0;
        for (int i = col + 1; i < 8; i++) {
            sum += A[col * 9 + i] * A[i * 9 + 8];
        }
        A[col * 9 + 8] = (A[col * 9 + 8] - sum) / A[col * 9 + col];
    }
    // ^^^ 高斯消元法 ^^^

    dst[0][0] = A[8], dst[0][1] = A[17], dst[0][2] = A[26];
    dst[1][0] = A[35], dst[1][1] = A[44], dst[1][2] = A[53];
    dst[2][0] = A[62], dst[2][1] = A[71], dst[2][2] = 1;

    return true;
}

void homography_project(const float H[3][3], float x, float y, float* ox, float* oy) {
    float xx = H[0][0] * x + H[0][1] * y + H[0][2];
    float yy = H[1][0] * x + H[1][1] * y + H[1][2];
    float zz = H[2][0] * x + H[2][1] * y + H[2][2];
    *ox = xx / zz;
    *oy = yy / zz;
}
```

{% endcontentbox %}

## 2. 用法

### 2.1 摄像头图像坐标向地板坐标变换

1. 把摄像头粘死在车模上，动不了的那种，防止摄像头被碰歪导致标定的数据失效；
2. 把车模放在地板上，打开摄像头和显示屏，并连接好图传设备；
3. 用颜色显眼的胶布或记号笔在地板上标出车模的位置，并标出摄像头所能拍到的4个角附近的4个特征点；
4. 在不移动车模的情况下，将此时能拍到这4个特征点的摄像头图像保存下来；
5. 记录这4个特征点在图像中的坐标，并用尺子测量出这4个特征点在地板上的坐标；
  - 图像中的坐标按你自己的习惯来使用`(i行,j列)`或`(x列,y行)`，只要在后续调用时保持统一即可
  - 地板上的坐标一般以车模底盘中心为原点，向前为x轴，向左为y轴，单位为米
6. 在单片机初始化的部分调用`homography_compute`函数，将上述4个特征点的坐标传入，得到单应矩阵`H`；
7. 在主循环和其它地方调用`homography_project`函数，将初始化时计算好的`H`和摄像头图像中某点的坐标`(i,j)`或`(x,y)`传入，得到这个点在地板上的坐标`(x',y')`。

例如：

{% contentbox "c" type:code %}

```c
int main() {
    // vvv 初始化 vvv
    // 求解从(x,y)所在平面(摄像头图像)到(x',y')所在平面(地板)的单应矩阵H
    // 假设摄像头图像的分辨率是188x120，测量得到的4个特征点的坐标如下
    float C[4][4] = {
        // clang-format off
        // x,   y,     x',    y'
          {1,   2,     0.50,  0.32},  // 左上角
          {2,   118,   0.13,  0.14},  // 左下角
          {186, 116,   0.13, -0.14},  // 右下角
          {185, 4,     0.50, -0.32},  // 右上角
        // clang-format on
    };
    float H[3][3];
    homography_compute(H, C);
    /// ^^^ 初始化 ^^^

    // vvv 主循环 vvv
    while (1) {
        // 假设在处理摄像头图像的时候碰到了一个点(20, 40)
        int x = 20, y = 40;
        float px, py;
        homography_project(H, x, y, &px, &py);
        // 得到的(px, py)就是这个点在地板上的坐标
    }
    /// ^^^ 主循环 ^^^
}
```

{% endcontentbox %}

这种做法相当于是在处理摄像头图像时，先处理原图，在原图上得到有用的特征点之后再变换到地板上得到它的真实坐标。这样做只需要对少量的特征点坐标进行变换，基本不会有明显的额外性能开销。

### 2.2 地板坐标向摄像头图像坐标变换

也可以在处理图像时直接按地板上的坐标来处理，做法如下：

1. 把保存坐标的矩阵`C`的前两列和后两列互换，即改为求从地板到摄像头图像的单应矩阵；
2. 当获取到一张摄像头图像时，对于每个地板坐标`(x',y')`，调用`homography_project`函数得到它在摄像头图像中的坐标`(x,y)`；
3. 用插值获取在摄像头图像在`(x,y)`处的颜色值，将这个值作为地板上`(x',y')`处的颜色值。

{% contentbox "c" type:code %}

```c
int main() {
    // vvv 初始化 vvv
    float C[4][4] = {
        // clang-format off
        // x',    y',     x,   y
          {0.50,  0.32,   1,   2  },  // 左上角
          {0.13,  0.14,   2,   118},  // 左下角
          {0.13, -0.14,   186, 116},  // 右下角
          {0.50, -0.32,   185, 4  },  // 右上角
        // clang-format on
    };
    float H[3][3];
    homography_compute(H, C);
    /// ^^^ 初始化 ^^^

    // vvv 主循环 vvv
    while (1) {
        // 假设现在要获取地板上坐标为(10, 5)处的颜色值
        int px = 10, py = 5;
        float x, y;
        homography_project(H, px, py, &x, &y);
        // 得到的(x, y)就是这个点在摄像头图像上的坐标

        // 最近邻插值，就是直接取最近的像素点的颜色值；效果并不好，会出现锯齿，仅作为演示
        int x_ = lroundf(x), y_ = lroundf(y);
        uint8_t color;
        // 必须额外进行边界检查
        if (0 <= x && x < WIDTH && 0 <= y && y < HEIGHT)
            color = image[y_][x_];
        else
            color = 0;  // 超出图像范围的点，颜色自定
    }
    /// ^^^ 主循环 ^^^
}
```

{% endcontentbox %}

这样做效率较低，边界处理也很麻烦(因为现在图像的边界并不是横平竖直的了)，所以不建议这样操作。不过倒是可以用在17届智能视觉组的目标卡片分类上，效果见[b站](https://www.bilibili.com/video/BV1eB4y1x76N?p=2)视频末尾。原理是先构建一个用来保存地板坐标系下图片的数组，对于数组里的每一个坐标，从原图里找颜色。
