import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Switch,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { t } from "i18next";

import { useCreateFunctionMutation, useUpdateFunctionMutation } from "../../../service";
import useFunctionStore from "../../../store";

import functionTemplates from "./functionTemplates";

import useGlobalStore from "@/pages/globalStore";

const CreateModal = (props: { functionItem?: any; children?: React.ReactElement }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const store = useFunctionStore();
  const { showSuccess } = useGlobalStore();

  const { functionItem, children = null } = props;
  const isEdit = !!functionItem;

  const defaultValues = {
    name: functionItem?.name || "",
    description: functionItem?.desc || "",
    websocket: !!functionItem?.websocket,
    methods: functionItem?.methods || ["GET", "POST"],
    code: functionItem?.source.code || functionTemplates[0].value,
    tags: [],
  };

  type FormData = {
    name: string;
    description: string;
    websocket: boolean;
    methods: string[];
    code: string;
  };

  const {
    register,
    handleSubmit,
    control,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues,
  });

  const createFunctionMutation = useCreateFunctionMutation();
  const updateFunctionMutation = useUpdateFunctionMutation();

  const onSubmit = async (data: any) => {
    data.tags = [];
    let res: any = {};
    if (isEdit) {
      res = await updateFunctionMutation.mutateAsync(data);
    } else {
      res = await createFunctionMutation.mutateAsync(data);
    }

    if (!res.error) {
      showSuccess(isEdit ? "update success" : "create success");
      onClose();
      store.setCurrentFunction(res.data);
      reset(defaultValues);
    }
  };

  return (
    <>
      {children &&
        React.cloneElement(children, {
          onClick: () => {
            onOpen();
            reset(defaultValues);
            setTimeout(() => {
              setFocus("name");
            }, 0);
          },
        })}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEdit ? t("FunctionPanel.EditFunction") : t("FunctionPanel.AddFunction")}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <VStack spacing={6} align="flex-start">
              <FormControl isInvalid={!!errors?.name}>
                <FormLabel htmlFor="name">{t("FunctionPanel.FunctionName")}</FormLabel>
                <Input
                  {...register("name", {
                    required: "name is required",
                  })}
                  id="name"
                  placeholder={t("FunctionPanel.FunctionNameTip") + "get-user "}
                  disabled={isEdit}
                  variant="filled"
                />
                <FormErrorMessage>{errors.name && errors.name.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors?.methods}>
                <FormLabel htmlFor="methods">{t("FunctionPanel.Methods")}</FormLabel>
                <HStack spacing={6}>
                  <Controller
                    name="methods"
                    control={control}
                    render={({ field: { ref, ...rest } }) => (
                      <CheckboxGroup {...rest}>
                        <Checkbox value="GET">GET</Checkbox>
                        <Checkbox value="POST">POST</Checkbox>
                        <Checkbox value="HEAD">HEAD</Checkbox>
                        <Checkbox value="PATCH">PATCH</Checkbox>
                        <Checkbox value="DELETE">DELETE</Checkbox>
                      </CheckboxGroup>
                    )}
                    rules={{
                      required: { value: true, message: "Please select at least one" },
                    }}
                  />
                </HStack>
                <FormErrorMessage>{errors.methods?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="description">{t("FunctionPanel.Description")}</FormLabel>
                <Input
                  {...register("description")}
                  id="description"
                  placeholder={t("FunctionPanel.Description").toString()}
                  variant="filled"
                />
              </FormControl>

              {isEdit ? null : (
                <FormControl>
                  <FormLabel htmlFor="code">{t("FunctionPanel.Code")}</FormLabel>
                  <Select {...register("code")} id="code" placeholder="" variant="filled">
                    {functionTemplates.map((item) => {
                      return (
                        <option value={item.value.trim()} key={item.label}>
                          {item.label}
                        </option>
                      );
                    })}
                  </Select>
                </FormControl>
              )}

              <FormControl isInvalid={!!errors?.websocket} hidden>
                <FormLabel htmlFor="websocket">{t("FunctionPanel.isSupport")} websocket</FormLabel>
                <Switch {...register("websocket")} id="websocket" variant="filled" />
                <FormErrorMessage>
                  {errors.websocket && errors.websocket.message}
                </FormErrorMessage>{" "}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" type="submit" onClick={handleSubmit(onSubmit)}>
              {t("Confirm")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateModal;
