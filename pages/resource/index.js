
import {useCallback, useEffect, useState, useRef} from "react";
import {Divider, Input, Button, Table, Space, Popconfirm, Modal} from 'antd';

import styles from "./index.module.scss";
import {$http, updateToken} from "../../http";
import Tag from "../../components/Tag";
import {LoadingOutlined} from '@ant-design/icons';

function addZero(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return number;
}

function formatTime(time) {
  const date = new Date(time);
  return `${date.getFullYear()}-${addZero(date.getMonth() + 1)}-${addZero(
    date.getDate(),
  )} ${date.getHours()}:${addZero(date.getMinutes())}`;
}

export default function Resource() {
  const [tagList1, setTagList1] = useState([])
  const [tagList2, setTagList2] = useState([])
  const [token, setToken] = useState('')
  const [activeTag1, setActiveTag1] = useState('')
  const [activeTag2, setActiveTag2] = useState('')
  const [value1, setValue1] = useState('')
  const [loading1, setLoading1] = useState(false)
  const [value2, setValue2] = useState('')
  const [loading2, setLoading2] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [resourceList, setResourceList] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [status, setStatus] = useState('parentTag')
  const [editResource, setEditResource] = useState(null)

  const fileInputRef = useRef(null);

  const fetchTag1 = () => {
    const payload = {conds: {}}
    $http.post('label/search', payload).then(res => {
      const result = res?.result.filter(item => item?.parent === undefined)
      setTagList1(result || [])
    })
  }

  useEffect(() => {
    $http.post('user/signin', {name: 'admin'}).then(res => {
      if (res?.token) {
        setToken(res.token)
      }
    })
  }, [])

  useEffect(() => {
    if (token) {
      updateToken(token)
      fetchTag1()
    }
  }, [token])

  const onTagClicked = useCallback((data) => {
    setActiveTag1(data._id)
    setTagList2(data.children)
    setActiveTag2('')
  }, [])

  const onSubTagClicked = useCallback((data) => {
    setActiveTag2(data._id)
  }, [])

  const onAddParentTagClicked = useCallback(() => {
    setLoading1(true)
    $http.post('label/create', {
      name: value1,
    }).then(() => {
      fetchTag1()
      setValue1('')
    }).finally(() => {
      setLoading1(false)
    })
  }, [value1])

  const onAddSunTagClicked = useCallback(() => {
    setLoading2(true)
    $http.post('label/create', {
      name: value2,
      parent: activeTag1
    }).then(() => {
      fetchTag1()
      setValue2('')
    }).finally(() => {
      setLoading2(false)
    })
  }, [value2])

  useEffect(() => {
    if (activeTag1) {
      const result = tagList1.find(item => item._id === activeTag1)
      setTagList2(result?.children || [])
    }
  }, [tagList1])

  const onDeleteParentTagClicked = () => {
    $http.post('label/remove', {_id: activeTag1}).then(() => {
      fetchTag1()
      setActiveTag1('')
    })
  }

  const onDeleteSubTagClicked = data => {
    $http.post('label/remove', {_id: activeTag2}).then(() => {
      fetchTag1()
      setActiveTag2('')
      setResourceList([])
    })
  }

  const onUploadBtnClicked = () => {
    fileInputRef.current?.click();
  };

  const uploadAudio = useCallback((uploadLink, data) => {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'audio/mpeg');

    const requestOptions = {
      method: 'PUT',
      headers: myHeaders,
      body: data,
      redirect: 'follow',
    };

    return fetch(uploadLink, requestOptions);
  }, [])

  const onFileChange = async e => {
    setUploadLoading(true);
    const file = e.target.files[0];
    const fileName = file.name;
    const fileNameSplitByDot = fileName.split('.');
    const fileSuffix = fileNameSplitByDot[fileNameSplitByDot.length - 1];
    const preSignData = await $http.post('asset/getPresigned', {ext: fileSuffix})
    const uploadLink = preSignData.link;
    const token = preSignData.token;
    const formdata = new FormData();
    formdata.append('', file, token);
    await uploadAudio(uploadLink, formdata);
    await $http.post('asset/create', {
      token,
      name: fileName,
      label: activeTag2
    })
    setUploadLoading(false);
    fetchResourceList()
  }

  const fetchResourceList = () => {
    $http.post('asset/search', {
      conds: {
        label: activeTag2
      },
      page: 1,
      limit: 100
    }).then(res => {
      const data = res?.result.map(item => {
        item.key = item._id
        return item
      })
      setResourceList(data)
    })
  }

  const onDeleteResource = id => {
    $http.post('asset/remove', {_id: id}).then(res => {
      fetchResourceList()
    })
  }

  const onEditResourceName = resource => {
    setModalVisible(true)
    setStatus('resourceName')
    setEditResource(resource)
    setEditValue(resource.name)
  }

  const columns = [
    {
      title: 'Asset Id',
      dataIndex: '_id',
      key: '_id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Update Time',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (time) => formatTime(time)
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => onEditResourceName(record)}>Edit</Button>
          <Popconfirm
            placement="top"
            title="Confirm Delete？"
            onConfirm={() => onDeleteResource(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (activeTag2) {
      fetchResourceList()
    }
  }, [activeTag2])

  const onEditClicked = () => {
    setModalVisible(true)
    setStatus('parentTag')
    tagList1.forEach(item => {
      if (item._id === activeTag1) {
        setEditValue(item.name)
      }
    })
  }

  const handleOk = () => {
    setConfirmLoading(true)
    if (status === 'parentTag') {
      $http.post('label/update', {_id: activeTag1, name: editValue})
        .then(() => {
          fetchTag1()
        })
        .finally(() => {
          setConfirmLoading(false)
          setModalVisible(false)
        })
    } else if (status === 'subTag') {
      $http.post('label/update', {_id: activeTag2, name: editValue})
        .then(() => {
          fetchTag1()
        })
        .finally(() => {
          setConfirmLoading(false)
          setModalVisible(false)
        })
    } else if (status === 'resourceName') {
      $http.post('asset/update', {_id: editResource._id, name: editValue})
        .then(() => {
          fetchResourceList()
        })
        .finally(() => {
          setConfirmLoading(false)
          setModalVisible(false)
        })
    }
  }

  const handleCancel = () => {
    setModalVisible(false)
  }

  const onEditSubTagClicked = () => {
    setModalVisible(true)
    setStatus('subTag')
    tagList2.forEach(item => {
      if (item._id === activeTag2) {
        setEditValue(item.name)
      }
    })
  }

  return (
    <div>
      <h3>资源管理</h3>
      <Divider />
      <div className={styles.container}>
        <ul>
          <li>
            <Divider orientation="left">一级标签</Divider>
            <div>
              <Input className={styles.input1} value={value1} onChange={e => setValue1(e.target.value)} />
              <Button
                type="primary"
                disabled={value1 === '' || loading1}
                onClick={onAddParentTagClicked}
              >
                {loading1 ? <LoadingOutlined /> : 'Add'}
              </Button>
              <div className={styles.actionWrap}>
                <Button type="primary" disabled={!activeTag1} onClick={onEditClicked}>Edit</Button>
                <Popconfirm
                  placement="top"
                  title="Confirm Delete？"
                  onConfirm={onDeleteParentTagClicked}
                  okText="Yes"
                  cancelText="No"
                  disabled={!activeTag1}
                >
                  <Button type="danger" disabled={!activeTag1}>Delete</Button>
                </Popconfirm>
              </div>
            </div>
            {
              tagList1.map(item => (
                <Tag
                  type="blue"
                  key={item.name}
                  onClick={() => onTagClicked(item)}
                  active={activeTag1 === item._id}
                >
                  {item.name}
                </Tag>
              ))
            }
          </li>
          <li>
            <Divider orientation="left">二级标签</Divider>
            {
              activeTag1 ? (
                <>
                  <div>
                    <Input className={styles.input1} value={value2} onChange={e => setValue2(e.target.value)} />
                    <Button
                      type="primary"
                      disabled={value2 === '' || loading2}
                      onClick={onAddSunTagClicked}
                    >
                      {loading2 ? <LoadingOutlined /> : 'Add'}
                    </Button>
                    <div className={styles.actionWrap}>
                      <Button type="primary" disabled={!activeTag2} onClick={onEditSubTagClicked}>Edit</Button>
                      <Popconfirm
                        placement="top"
                        title="Confirm Delete？"
                        onConfirm={onDeleteSubTagClicked}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="danger" disabled={!activeTag2}>Delete</Button>
                      </Popconfirm>
                    </div>
                  </div>
                  {
                    tagList2.map(item => (
                      <Tag
                        type="green"
                        key={item.name}
                        onClick={() => onSubTagClicked(item)}
                        active={activeTag2 === item._id}
                      >
                        {item.name}
                      </Tag>
                    ))
                  }
                </>
              ) : '请先选择一级标签'
            }
          </li>
          <li>
            <Divider orientation="left">资源</Divider>
            {activeTag2 ? (
              <div>
                <div className={styles.uploadWrap}>
                  <Button
                    type="primary"
                    onClick={onUploadBtnClicked}
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? <LoadingOutlined /> : 'Upload'}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className={styles.uploadBtn}
                    onChange={onFileChange}
                    accept=".mp3,.wav"
                  />
                </div>
                <Table columns={columns} dataSource={resourceList} />
              </div>
            ) : '请先选择二级标签'}
          </li>
        </ul>
      </div>
      <Modal
        title="Edit"
        visible={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose={true}
        confirmLoading={confirmLoading}
      >
        <label className={styles.label}>标签名：</label>
        <Input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} />
      </Modal>
    </div>
  )
}
