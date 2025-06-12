import React from 'react';
import { 
  Ionicons, 
  MaterialIcons, 
  MaterialCommunityIcons, 
  Feather,
  AntDesign,
  FontAwesome5,
  Entypo
} from '@expo/vector-icons';

type IconLibrary = 'ionicons' | 'material' | 'material-community' | 'feather' | 'antdesign' | 'fontawesome5' | 'entypo';

interface IconProps {
  library: IconLibrary;
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const Icon: React.FC<IconProps> = ({ 
  library, 
  name, 
  size = 24, 
  color = '#ffffff', 
  style 
}) => {
  const iconProps = { name: name as any, size, color, style };

  switch (library) {
    case 'ionicons':
      return <Ionicons {...iconProps} />;
    case 'material':
      return <MaterialIcons {...iconProps} />;
    case 'material-community':
      return <MaterialCommunityIcons {...iconProps} />;
    case 'feather':
      return <Feather {...iconProps} />;
    case 'antdesign':
      return <AntDesign {...iconProps} />;
    case 'fontawesome5':
      return <FontAwesome5 {...iconProps} />;
    case 'entypo':
      return <Entypo {...iconProps} />;
    default:
      return <Ionicons {...iconProps} />;
  }
};

// Predefined app-specific icons for consistency
export const AppIcons = {
  // Tab bar icons
  phone: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="call" {...props} />
  ),
  recent: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="time" {...props} />
  ),
  contacts: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="people" {...props} />
  ),
  settings: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="settings" {...props} />
  ),
  
  // Call actions
  callEnd: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="call" color="#ff4757" {...props} />
  ),
  callAnswer: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="call" color="#00ff88" {...props} />
  ),
  mute: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="mic-off" {...props} />
  ),
  speaker: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="volume-high" {...props} />
  ),
  keypad: (props: Partial<IconProps>) => (
    <Icon library="material" name="dialpad" {...props} />
  ),
  record: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="radio-button-on" color="#ff4757" {...props} />
  ),
  
  // Navigation
  back: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="arrow-back" {...props} />
  ),
  add: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="add" {...props} />
  ),
  edit: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="pencil" {...props} />
  ),
  delete: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="trash" color="#ff4757" {...props} />
  ),
  chevronRight: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="chevron-forward" {...props} />
  ),
  
  // Status indicators
  aiRouting: (props: Partial<IconProps>) => (
    <Icon library="material-community" name="robot" color="#00ff88" {...props} />
  ),
  savings: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="trending-down" color="#00ff88" {...props} />
  ),
  quality: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="cellular" color="#00ff88" {...props} />
  ),
  
  // Communication
  message: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="chatbubble" {...props} />
  ),
  email: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="mail" {...props} />
  ),
  
  // Support
  help: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="help-circle" {...props} />
  ),
  support: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="headset" {...props} />
  ),
  
  // Account
  profile: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="person" {...props} />
  ),
  logout: (props: Partial<IconProps>) => (
    <Icon library="ionicons" name="log-out" color="#ff4757" {...props} />
  ),
};

export default Icon;