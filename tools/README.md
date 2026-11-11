# Demo 重新导出

运行 python3 tools/capture_demo.py --out recordings，然后在支持 WebCodecs H.264 的浏览器中打开 http://127.0.0.1:8811/?export=1 并点击导出按钮。

逐帧生成 3840x2160、60fps、40 秒的实际三维画面。每帧有独立时间戳，不使用补帧。导出后使用 FFmpeg 封装：

    ffmpeg -r 60 -i recordings/demo_native4k.h264 -c:v copy -video_track_timescale 60000 -movflags +faststart Demo.mp4

输出码流、视频元数据、进度和选定帧写入指定 recordings 目录。网页实时帧率与视频固定帧率分别衡量。

编码依据：https://www.w3.org/TR/webcodecs-avc-codec-registration/
