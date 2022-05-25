
import {useCallback, useEffect, useState, useRef} from "react";
import {Divider, Input, Button, Table, Space, Popconfirm} from 'antd';

import styles from "./index.module.scss";
import {$http, updateToken} from "../../http";
import Tag from "../../components/Tag";
import {CloseOutlined, LoadingOutlined} from '@ant-design/icons';

const USERID = '627dd3a6e4591fd54c1a4888'

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

  const fileInputRef = useRef(null);

  const fetchTag1 = () => {
    const payload = {
      conds: {
        user: USERID
      }
    }
    $http.post('label/search', payload).then(res => {
      const result = res?.result.filter(item => item?.parent === undefined)
      setTagList1(result || [])
    })
  }

  useEffect(() => {
    $http.post('user/signin', {name: 'Lester'}).then(res => {
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
      user: USERID
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
      user: USERID,
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

  const onDeleteParentTagClicked = data => {
    $http.post('label/remove', {_id: data._id}).then(() => {
      fetchTag1()
    })
  }

  const onDeleteSunTagClicked = data => {
    $http.post('label/remove', {_id: data._id}).then(() => {
      fetchTag1()
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
    const res = await $http.post('asset/create', {
      token,
      user: USERID,
      name: fileName,
      label: activeTag2
    })
    setUploadLoading(false);
    fetchResourceList()
  }

  const fetchResourceList = () => {
    $http.post('asset/search', {
      conds: {
        user: USERID,
        label: activeTag2
      },
      page: 1,
      limit: 100
    }).then(res => {
      console.log(res)
      setResourceList(res.result)
    })
  }

  const onDeleteResource = id => {
    $http.post('asset/remove', {_id: id}).then(res => {
      fetchResourceList()
    })
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
      key: 'updateAt',
      render: (time) => formatTime(time)
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
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
            </div>
            {
              tagList1.map(item => (
                <Tag
                  type="blue"
                  key={item.name}
                  onClick={() => onTagClicked(item)}
                  active={activeTag1 === item._id}
                  onDelete={() => onDeleteParentTagClicked(item)}
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
                  </div>
                  {
                    tagList2.map(item => (
                      <Tag
                        type="green"
                        key={item.name}
                        onClick={() => onSubTagClicked(item)}
                        active={activeTag2 === item._id}
                        onDelete={() => onDeleteSunTagClicked(item)}
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
    </div>
  )
}
