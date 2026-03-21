import { View, Text } from '@tarojs/components';
import type { JobRoleDTO, JobRole } from '../../types/interview';
import './index.scss';

interface JobRoleCardProps {
  role: JobRoleDTO;
  selected: boolean;
  disabled?: boolean;
  onSelect: (role: JobRole) => void;
}

export default function JobRoleCard({
  role,
  selected,
  disabled = false,
  onSelect,
}: JobRoleCardProps) {
  const className = [
    'job-role-card',
    selected ? 'selected' : '',
    disabled ? 'disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View
      className={className}
      hoverClass={disabled ? '' : 'job-role-card-hover'}
      onClick={() => {
        if (!disabled) {
          onSelect(role.code);
        }
      }}
    >
      <View className="card-header">
        <Text className="card-title">{role.label}</Text>
        {selected && <Text className="selected-badge">已选择</Text>}
      </View>
      <Text className="card-description">{role.description}</Text>
      <View className="keyword-list">
        {role.techKeywords.map((keyword) => (
          <Text className="keyword-tag" key={keyword}>
            {keyword}
          </Text>
        ))}
      </View>
    </View>
  );
}
