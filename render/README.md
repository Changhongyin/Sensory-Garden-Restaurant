# 原生 Blender 高清渲染工程
Garden_Final_Packed.blend 是 C07r12 结束版本的可移植工程，图像全部内嵌；未改动设计、材质外观或冻结天空。
对象级相同材质槽被迁移到共享网格，保持材质一致并恢复实例化；高密度几何节点只在编辑视口关闭，渲染保持开启。

Blender 5.2.3 LTS。独立渲染：

    blender -b --python render_final.py -- --profile original --threads 8

Mac 的完整命令：

    /Applications/Blender.app/Contents/MacOS/Blender -b --python render_final.py -- --profile final --threads 8

profile original: 原交付分辨率 1440x1800，96 samples。
profile final: 2160x2700，256 samples；更高采样，按硬件性能等待完成。
profile ultra: 3840x4800，512 samples；大内存、长时间渲染配置。
profile verify: 64x80，1 sample，仅验证工程可加载与渲染执行，不能评价最终画质。

各 profile 独立输出 PNG、线性 EXR 与运行清单；渲染代码不覆盖工程。
默认有效纹理上限 2048，保留全量几何与渲染实例。建议至少 16GB 可用内存，保留系统余量。
4K/60fps Demo 是实际三维画面的逐帧网页导出，不等于数千帧的 Cycles 离线序列，也不代表实时运行稳定 60fps。

本次实测 final 配置已完成：2160x2700、256 samples、CPU 8 线程，原生 PNG 与线性 EXR 随交付提供。ultra 配置用于有充足时间与内存的重新渲染，未宣称已完成。
