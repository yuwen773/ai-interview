import { View, Text, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { resumeApi } from '../../api/resume';
import Loading from '../../components/common/Loading';
import './index.scss';

export default function Upload() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const handleChooseFile = async () => {
    try {
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['pdf', 'doc', 'docx'],
      });
      if (res.tempFiles.length > 0) {
        setFile(res.tempFiles[0].path);
        setFileName(res.tempFiles[0].name); // 保存原始文件名
      }
    } catch (err) {
      Taro.showToast({ title: '选择文件失败', icon: 'none' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Taro.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      // 上传并分析简历
      const res = await resumeApi.uploadAndAnalyze(file);
      Taro.showToast({ title: '上传成功', icon: 'success' });
      // 跳转到简历详情 - 兼容不同返回格式，确保转为字符串
      const resumeId = String(res.resume?.id ?? res.storage?.resumeId);
      console.log('Upload - resumeId:', resumeId);
      if (!resumeId || resumeId === 'undefined') {
        Taro.showToast({ title: '获取简历ID失败', icon: 'none' });
        return;
      }
      setTimeout(() => {
        Taro.navigateTo({ url: `/pages/resume-detail/index?id=${resumeId}` });
      }, 1500);
    } catch (err) {
      Taro.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="upload-page page-shell">
      <View className="upload-card" onClick={handleChooseFile}>
        <View className="upload-icon">
          <Text className="icon">{file ? '✓' : '+'}</Text>
        </View>
        <Text className="upload-hint">
          {file ? fileName : '点击上传简历 (PDF/Word)'}
        </Text>
      </View>

      <Button className="upload-btn" onClick={handleUpload} disabled={!file || loading}>
        {loading ? '上传中...' : '开始分析'}
      </Button>

      {loading && <Loading text="正在分析简历..." fullPage />}
    </View>
  );
}
