/**
 * 触发浏览器下载一个内存中的 Blob。
 *
 * 后端返回文件流的地方（简历、知识库、各类导出报告）都要「createObjectURL →
 * 造一个隐藏 <a> → click → 回收 URL」这一套，抽出来避免每个调用点抄一遍，
 * 也保证三件事不会漏：元素一定被移除、objectURL 一定被回收、文件名一定设置。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
