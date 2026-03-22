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
        setFileName(res.tempFiles[0].name);
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
      const res = await resumeApi.uploadAndAnalyze(file, fileName);
      Taro.showToast({ title: '上传成功', icon: 'success' });
      const resumeId = String(res.resume?.id ?? res.storage?.resumeId);
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
    <View className="upload-page">
      <View
        className={`upload-card ${file ? 'active' : ''}`}
        onClick={handleChooseFile}
      >
        <View className="upload-icon">
          <Text className="upload-icon-text">{file ? '✓' : '+'}</Text>
        </View>
        <Text className="upload-title">
          {file ? '已选择文件' : '点击上传简历'}
        </Text>
        <Text className="upload-hint">
          {file ? fileName : '将简历文件拖拽到此处或点击选择'}
        </Text>
        {!file && (
          <View className="upload-formats">
            <Text className="format-tag">PDF</Text>
            <Text className="format-tag">Word</Text>
            <Text className="format-tag">DOC</Text>
          </View>
        )}
      </View>

      <Button
        className="upload-btn"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        <Text className="btn-text">{loading ? '上传中...' : '开始分析'}</Text>
      </Button>

      {loading && <Loading text="正在分析简历..." />}
    </View>
  );
}
