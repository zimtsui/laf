import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon } from "@chakra-ui/icons";
import {
  Menu,
  MenuItem,
  MenuList,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";

import FileUpload from "@/components/FileUpload";

import useStorageStore from "../../store";

import useAwsS3 from "@/hooks/useAwsS3";
import useGlobalStore from "@/pages/globalStore";

export type TFileItem = {
  status: boolean;
  fileName: string;
};
function UploadButton(props: { onUploadSuccess: Function; children: React.ReactElement }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentStorage, prefix } = useStorageStore();
  const { showSuccess } = useGlobalStore();
  const { uploadFile } = useAwsS3();
  const [uploadType, setUploadType] = React.useState<"file" | "folder">("file");
  const [fileList, setFileList] = React.useState<TFileItem[]>([]);
  const { t } = useTranslation();
  const { onUploadSuccess, children } = props;
  return (
    <div>
      <Menu placement="bottom-start">
        {React.cloneElement(children)}
        <MenuList minW={24}>
          <MenuItem
            onClick={() => {
              setUploadType("file");
              setFileList([]);
              onOpen();
            }}
          >
            {t("StoragePanel.File")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setUploadType("folder");
              setFileList([]);
              onOpen();
            }}
          >
            {t("StoragePanel.Folder")}
          </MenuItem>
        </MenuList>
      </Menu>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {uploadType === "file" ? t("StoragePanel.UploadFile") : t("StoragePanel.UploadFolder")}
          </ModalHeader>
          <ModalCloseButton />
          <div className="p-6">
            <FileUpload
              uploadType={uploadType}
              onUpload={async (files) => {
                console.log(files);
                const newFileList = Array.from(files).map((item: any) => {
                  return {
                    fileName: item.webkitRelativePath ? item.webkitRelativePath : item.name,
                    status: false,
                  };
                });
                setFileList(newFileList);
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const fileName = file.webkitRelativePath ? file.webkitRelativePath : file.name;
                  await uploadFile(currentStorage?.name!, prefix + fileName, file, {
                    contentType: file.type,
                  });
                  setFileList((pre) => {
                    const newList = [...pre];
                    newList[i].status = true;
                    return newList;
                  });
                }
                onUploadSuccess();
                onClose();
                showSuccess(t("StoragePanel.Success"));
              }}
            />
            <div className="mt-2 max-h-40 overflow-auto">
              {fileList.map((item) => {
                return (
                  <div
                    key={item.fileName}
                    className="my-2 px-5 flex w-full h-10 justify-between items-center hover:bg-slate-100"
                  >
                    <span className="text-slate-500">{item.fileName}</span>
                    {item.status ? <CheckCircleIcon color="green.500" fontSize={20} /> : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default UploadButton;
