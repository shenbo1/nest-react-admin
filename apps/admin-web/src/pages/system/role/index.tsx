import { useRef, useState } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
  ProFormDigit,
} from "@ant-design/pro-components";
import { message, Popconfirm, Space, Tag, Tree, Modal, Form } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleApi, menuApi, Role, CreateRoleParams } from "@/services/system/system";
import PermissionButton from "@/components/PermissionButton";
import ProTable, { ProTableRef } from "@/components/ProTable";
import { SYSTEM } from "@/constants/permissions";
import dayjs from "dayjs";
import { generateKeyFromName } from "@/utils/name-key";

const RoleList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Role | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [menuCheckedKeys, setMenuCheckedKeys] = useState<number[]>([]);
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [form] = Form.useForm<CreateRoleParams>();
  const queryClient = useQueryClient();

  const { data: menuTree } = useQuery({
    queryKey: ["menu-tree"],
    queryFn: menuApi.treeSelect,
  });

  const saveMutation = useMutation({
    mutationFn: (values: CreateRoleParams) => {
      // 处理选中的菜单ID，确保包含所有父级菜单ID
      const treeData = menuTree ? transformMenuTree(menuTree) : [];
      const processedMenuIds = processCheckedKeys(treeData, checkedKeys);

      console.log("💾 保存角色权限:", {
        originalMenuIds: checkedKeys,
        processedMenuIds: processedMenuIds,
        addedParentIds: processedMenuIds.filter(id => !checkedKeys.includes(id)),
      });

      const params = { ...values, menuIds: processedMenuIds };
      if (editingId) {
        return roleApi.update(editingId, params);
      }
      return roleApi.create(params);
    },
    onSuccess: () => {
      message.success(editingId ? "更新成功" : "创建成功");
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      setCheckedKeys([]);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const assignMenuMutation = useMutation({
    mutationFn: ({
      roleId,
      menuIds,
    }: {
      roleId: number;
      menuIds: number[];
    }) => {
      return roleApi.update(roleId, { menuIds });
    },
    onSuccess: () => {
      message.success("分配菜单成功");
      setMenuModalOpen(false);
      setAssigningRole(null);
      setMenuCheckedKeys([]);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      console.error("分配菜单失败:", error);
      message.error(error?.message || "分配菜单失败，请重试");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: roleApi.delete,
    onSuccess: () => {
      message.success("删除成功");
      tableRef.current?.reload();
    },
  });

  const handleEdit = (record: Role) => {
    setEditingId(record.id);
    setEditingRecord(record);
    const initialMenuIds = record.menus?.map((m) => m.menu.id) || [];

    console.log("📝 编辑角色加载权限:", {
      roleName: record.name,
      menuIds: initialMenuIds,
    });

    setCheckedKeys(initialMenuIds);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setCheckedKeys([]);
    setKeyManuallyEdited(false);
    setModalOpen(true);
  };

  const handleAssignMenu = (record: Role) => {
    console.log("📋 handleAssignMenu - 开始处理角色:", record.name);
    console.log("📋 原始记录 - menus 字段:", record.menus);

    // 深度检查数据结构
    if (record.menus) {
      console.log("📋 菜单数据详细检查:");
      record.menus.forEach((menuItem, index) => {
        console.log(`  [${index}] menuItem:`, menuItem);
        console.log(`  [${index}] menuItem.menu:`, menuItem.menu);
        if (menuItem.menu) {
          console.log(`  [${index}] 菜单信息: ID=${menuItem.menu.id}, Name=${menuItem.menu.name}, ParentId=${menuItem.menu.parentId}`);
        }
      });
    } else {
      console.log("📋 警告: record.menus 是 undefined 或 null");
    }

    setAssigningRole(record);
    const initialMenuIds = record.menus?.map((m) => m.menu.id) || [];

    console.log("📋 加载角色已有权限 - 总结:", {
      roleName: record.name,
      menuIds: initialMenuIds,
      menuDetails: record.menus?.map((m) => ({
        menuId: m.menu.id,
        menuName: m.menu.name,
        parentId: m.menu.parentId,
        type: m.menu.type,
        path: m.menu.path,
        component: m.menu.component,
        perms: m.menu.perms,
      })),
    });

    // 检查Tree组件的数据结构
    console.log("📋 Tree组件数据结构:", {
      hasMenuTree: !!menuTree,
      menuTreeLength: menuTree?.length || 0,
      transformMenuTreeLength: menuTree ? transformMenuTree(menuTree).length : 0,
    });

    console.log("📋 handleAssignMenu - 结束处理角色:", record.name);

    // 直接设置初始菜单ID，不添加父级ID
    setMenuCheckedKeys(initialMenuIds);
    setMenuModalOpen(true);
  };

  const handleMenuAssignOk = () => {
    if (assigningRole) {
      // 处理选中的菜单ID，确保包含所有父级菜单ID
      const treeData = menuTree ? transformMenuTree(menuTree) : [];
      const processedMenuIds = processCheckedKeys(treeData, menuCheckedKeys);

      console.log("🔍 准备分配菜单权限:", {
        roleId: assigningRole.id,
        roleName: assigningRole.name,
        originalMenuIds: menuCheckedKeys,
        processedMenuIds: processedMenuIds,
        menuCount: processedMenuIds.length,
        addedParentIds: processedMenuIds.filter(id => !menuCheckedKeys.includes(id)),
      });

      assignMenuMutation.mutate({
        roleId: assigningRole.id,
        menuIds: processedMenuIds,
      });
    }
  };

  const transformMenuTree = (nodes: any[]): any[] => {
    return nodes.map((node) => {
      const treeNode = {
        key: node.id,
        title: node.name,
        parentId: node.parentId,
        children: node.children ? transformMenuTree(node.children) : undefined,
      };
      return treeNode;
    });
  };

  // 获取所有父级菜单ID（包括祖父级等）
  const getAllParentIds = (menuId: number, nodeMap: Map<number, any>): number[] => {
    const parentIds: number[] = [];
    let currentNode = nodeMap.get(menuId);

    while (currentNode && currentNode.parentId && currentNode.parentId !== 0) {
      parentIds.push(currentNode.parentId);
      currentNode = nodeMap.get(currentNode.parentId);
    }

    return parentIds;
  };

  // 获取所有子级菜单ID（递归获取所有后代）
  const getAllChildrenIds = (menuId: number, nodeMap: Map<number, any>): number[] => {
    const childrenIds: number[] = [];
    const node = nodeMap.get(menuId);

    if (node && node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        childrenIds.push(child.key);
        // 递归获取所有子级
        const descendantIds = getAllChildrenIds(child.key, nodeMap);
        childrenIds.push(...descendantIds);
      });
    }

    return childrenIds;
  };

  // 处理选中的菜单ID，确保包含所有父级菜单ID（仅在提交时调用）
  const processCheckedKeys = (treeData: any[], checkedKeys: number[]): number[] => {
    if (checkedKeys.length === 0) return [];

    // 构建菜单ID到节点的映射
    const nodeMap = new Map<number, any>();
    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        nodeMap.set(node.key, node);
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(treeData);

    const allKeys = new Set<number>(checkedKeys);

    for (const menuId of checkedKeys) {
      const parentIds = getAllParentIds(menuId, nodeMap);
      parentIds.forEach(parentId => allKeys.add(parentId));
    }

    return Array.from(allKeys);
  };

  const columns: ProColumns<Role>[] = [
    {
      title: "角色名称",
      dataIndex: "name",
      width: 150,
    },
    {
      title: "角色标识",
      dataIndex: "key",
      width: 150,
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 80,
      hideInSearch: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      valueType: "select",
      valueEnum: {
        ENABLED: { text: "正常", status: "Success" },
        DISABLED: { text: "停用", status: "Error" },
      },
      render: (_, record) => (
        <Tag color={record.status === "ENABLED" ? "success" : "error"}>
          {record.status === "ENABLED" ? "正常" : "停用"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 180,
      valueType: "dateTime",
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      valueType: "option",
      width: 220,
      render: (_, record) => (
        <Space>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.ROLE.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.MENU.LIST}
            icon={<SettingOutlined />}
            onClick={() => handleAssignMenu(record)}
            fallbackMode="disabled"
          >
            分配菜单
          </PermissionButton>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={SYSTEM.ROLE.REMOVE}
              icon={<DeleteOutlined />}
              fallbackMode="disabled"
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fetchRoles = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await roleApi.list({
      page: current,
      pageSize,
      ...rest,
    });
    return {
      data: result.data,
      total: result.total,
      success: true,
    };
  };

  return (
    <>
      <ProTable
        ref={tableRef}
        columns={columns}
        rowKey="id"
        request={fetchRoles}
        search={{
          labelWidth: "auto",
        }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={SYSTEM.ROLE.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增角色
          </PermissionButton>,
        ]}
      />

      {/* 新增/编辑角色弹窗 */}
      <ModalForm<CreateRoleParams>
        title={editingId ? "编辑角色" : "新增角色"}
        form={form}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingId(null);
            setEditingRecord(null);
            setCheckedKeys([]);
            setKeyManuallyEdited(false);
          } else if (!editingId) {
            setKeyManuallyEdited(false);
          }
        }}
        width={600}
        initialValues={
          editingRecord
            ? {
                name: editingRecord.name,
                key: editingRecord.key,
                sort: editingRecord.sort,
                dataScope: editingRecord.dataScope,
                status: editingRecord.status,
                remark: editingRecord.remark,
              }
            : { sort: 0, status: "ENABLED" }
        }
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="角色名称"
          rules={[{ required: true, message: "请输入角色名称" }]}
          placeholder="请输入角色名称"
          fieldProps={{
            onChange: (event) => {
              const value = event.target.value;
              if (!editingId && !keyManuallyEdited) {
                form.setFieldsValue({ key: generateKeyFromName(value) });
              }
            },
          }}
        />
        <ProFormText
          name="key"
          label="角色标识"
          rules={[{ required: true, message: "请输入角色标识" }]}
          placeholder="请输入角色标识"
          disabled={!!editingId}
          fieldProps={{
            onChange: () => setKeyManuallyEdited(true),
          }}
        />
        <ProFormDigit
          name="sort"
          label="排序"
          min={0}
          fieldProps={{ style: { width: "100%" } }}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: "正常", value: "ENABLED" },
            { label: "停用", value: "DISABLED" },
          ]}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注"
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>

      {/* 分配菜单弹窗 */}
      <Modal
        title={`分配菜单 - ${assigningRole?.name || ""}`}
        open={menuModalOpen}
        onOk={handleMenuAssignOk}
        onCancel={() => {
          setMenuModalOpen(false);
          setAssigningRole(null);
          setMenuCheckedKeys([]);
        }}
        confirmLoading={assignMenuMutation.isPending}
        width={500}
      >
        <div
          style={{
            maxHeight: 400,
            overflow: "auto",
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            padding: 12,
          }}
        >
          <Tree
            checkable
            checkStrictly={true}  // 改为严格模式，父子节点独立
            defaultExpandAll
            checkedKeys={menuCheckedKeys}
            onCheck={(keys, info) => {
              let checkedKeys: number[] = [];
              if (keys && typeof keys === "object" && !Array.isArray(keys)) {
                checkedKeys = (keys as any).checked || [];
              } else if (Array.isArray(keys)) {
                checkedKeys = keys.map((k: any) =>
                  typeof k === "number" ? k : k.key
                );
              }

              const treeData = menuTree ? transformMenuTree(menuTree) : [];
              const nodeMap = new Map<number, any>();
              const traverse = (nodes: any[]) => {
                nodes.forEach((node) => {
                  nodeMap.set(node.key, node);
                  if (node.children) {
                    traverse(node.children);
                  }
                });
              };
              traverse(treeData);

              const finalCheckedKeys = new Set<number>(checkedKeys);
              const targetKey =
                typeof (info as any).node?.key === "number"
                  ? (info as any).node.key
                  : Number((info as any).node?.key);
              const targetChildren = Number.isFinite(targetKey)
                ? getAllChildrenIds(targetKey, nodeMap)
                : [];

              if (info.checked) {
                targetChildren.forEach((childId) => finalCheckedKeys.add(childId));
              } else {
                targetChildren.forEach((childId) =>
                  finalCheckedKeys.delete(childId)
                );
              }

              setMenuCheckedKeys(Array.from(finalCheckedKeys));
            }}
            treeData={menuTree ? transformMenuTree(menuTree) : []}
          />
        </div>
      </Modal>
    </>
  );
};

export default RoleList;
