import {useEffect, useState} from "react";
import {CloseOutlined} from '@ant-design/icons';
import styles from "./index.module.scss";
import {Popconfirm} from 'antd';

export default function Tag({type, active, onClick, onDelete, children}) {

  return (
    <div
      className={`
      ${styles.container}
      ${type === 'blue' ? styles.blue : styles.green}
      ${active && type === 'blue' ? styles.blueActive : '' }
      ${active && type === 'green' ? styles.greenActive : '' }
      `}
      onClick={onClick}
    >
      {children}
      <Popconfirm
        placement="top"
        title="Confirm Delete？"
        onConfirm={onDelete}
        okText="Yes"
        cancelText="No"
      >
        <CloseOutlined className={styles.closeBtn} />
      </Popconfirm>
    </div>
  )
}
