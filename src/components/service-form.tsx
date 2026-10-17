"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Plus, RotateCcw, Save, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { serviceInputSchema, type ServiceInput, type ServiceItemInput } from "@/lib/validations";
import { lineTotalOf, serviceTotals } from "@/lib/service-totals";
import { api } from "@/lib/api-client";
import { formatNumber } from "@/lib/format";
import type { ServiceRecordDto } from "@/types/service";

interface Props {
  editing?: ServiceRecordDto | null;
  onSaved: () => void;
  onCancelEdit?: () => void;
}

const emptyItem: ServiceItemInput = {
  itemCode: "",
  description: "",
  quantity: 1,
  unit: "",
  unitPrice: 0,
  discount: 0,
};

const emptyValues = (): ServiceInput => ({
  serviceDate: new Date().toISOString().slice(0, 10),
  shopName: "",
  receiptNo: "",
  plateNo: "",
  vehicleModel: "",
  odometer: null,
  paymentMethod: "",
  discount: 0,
  note: "",
  items: [{ ...emptyItem }],
});

export function ServiceForm({ editing, onSaved, onCancelEdit }: Props) {
  const isEdit = Boolean(editing);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceInputSchema),
    defaultValues: emptyValues(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const [uploading, setUploading] = useState(false);
  // ยอดที่พิมพ์ในใบเสร็จ (จาก AI) ใช้เตือนเมื่อไม่ตรงกับยอดที่คำนวณ
  const [scannedTotal, setScannedTotal] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      reset({
        serviceDate: editing.serviceDate,
        shopName: editing.shopName,
        receiptNo: editing.receiptNo ?? "",
        plateNo: editing.plateNo ?? "",
        vehicleModel: editing.vehicleModel ?? "",
        odometer: editing.odometer,
        paymentMethod: editing.paymentMethod ?? "",
        discount: editing.discount,
        note: editing.note ?? "",
        receiptImagePath: editing.receiptImagePath,
        items: editing.items.map((it) => ({
          itemCode: it.itemCode ?? "",
          description: it.description,
          quantity: it.quantity,
          unit: it.unit ?? "",
          unitPrice: it.unitPrice,
          discount: it.discount,
        })),
      });
    } else {
      reset(emptyValues());
    }
  }, [editing, reset]);

  // คำนวณยอดรวมแบบ live
  const items = useWatch({ control, name: "items" }) ?? [];
  const billDiscount = useWatch({ control, name: "discount" });
  const imagePath = useWatch({ control, name: "receiptImagePath" });
  const totals = serviceTotals({ items, discount: Number(billDiscount) || 0 });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { imagePath, data, scanEnabled } = await api.uploadReceipt(file);
      if (!data) {
        setValue("receiptImagePath", imagePath);
        if (scanEnabled) toast.warning("แนบภาพแล้ว แต่อ่านข้อมูลไม่ได้ — กรุณากรอกเอง");
        else toast.success("แนบภาพใบเสร็จแล้ว — กดบันทึกเพื่อเก็บ");
        return;
      }
      const current = getValues();
      reset({
        ...current,
        serviceDate: data.serviceDate ?? current.serviceDate,
        shopName: data.shopName ?? current.shopName,
        receiptNo: data.receiptNo ?? "",
        plateNo: data.plateNo ?? "",
        vehicleModel: data.vehicleModel ?? "",
        odometer: data.odometer,
        paymentMethod: data.paymentMethod ?? "",
        discount: data.discount,
        receiptImagePath: imagePath,
        items: data.items.length
          ? data.items.map((it) => ({ ...it, itemCode: it.itemCode ?? "", unit: it.unit ?? "" }))
          : [{ ...emptyItem }],
      });
      setScannedTotal(data.totalAmount);
      toast.success("อ่านใบเสร็จแล้ว — กรุณาตรวจสอบก่อนบันทึก");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "อัปโหลดภาพไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && editing) {
        await api.updateService(editing.id, values);
        toast.success("แก้ไขใบเสร็จแล้ว");
      } else {
        await api.createService(values);
        toast.success("บันทึกใบเสร็จแล้ว");
      }
      reset(emptyValues());
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  });

  const handleCancel = () => {
    reset(emptyValues());
    onCancelEdit?.();
  };

  return (
    <Card className="no-print overflow-hidden bg-card/90 backdrop-blur">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
        <CardTitle className="flex items-center gap-2.5">
          <span className="hero-gradient grid size-8 place-items-center rounded-lg shadow">
            <Wrench className="size-4" />
          </span>
          {isEdit ? "แก้ไขใบเสร็จซ่อมบำรุง" : "เพิ่มใบเสร็จซ่อมบำรุง"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6 pt-5" noValidate>
          {/* แนบภาพใบเสร็จ */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              {uploading ? "กำลังอัปโหลด…" : "แนบภาพใบเสร็จ"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {imagePath
                ? "แนบภาพแล้ว ✓ — แนบใหม่เพื่อแทนที่"
                : "ไม่บังคับ — ถ้าเปิด AI ไว้จะอ่านและกรอกข้อมูลให้ (ไม่ดึงข้อมูลส่วนตัวลูกค้า)"}
            </p>
          </div>

          {/* ข้อมูลหัวใบเสร็จ */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 md:gap-x-5">
            <Field label="วันที่ในใบเสร็จ" required error={errors.serviceDate?.message}>
              <Input type="date" className="tabular" {...register("serviceDate")} />
            </Field>
            <Field label="ชื่อร้าน/อู่" required error={errors.shopName?.message}>
              <Input placeholder="เช่น B-Quik สาขา..." {...register("shopName")} />
            </Field>
            <Field label="เล่มที่/เลขที่ใบเสร็จ" error={errors.receiptNo?.message}>
              <Input {...register("receiptNo")} />
            </Field>
            <Field label="ทะเบียนรถ" error={errors.plateNo?.message}>
              <Input {...register("plateNo")} />
            </Field>
            <Field label="ยี่ห้อ/รุ่น" error={errors.vehicleModel?.message}>
              <Input placeholder="เช่น TOYOTA/VIOS" {...register("vehicleModel")} />
            </Field>
            <Field label="เลขไมล์ (กม.)" error={errors.odometer?.message}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                className="tabular"
                {...register("odometer", { setValueAs: (v) => (v === "" || v === null ? null : Number(v)) })}
              />
            </Field>
            <Field label="ชำระโดย" error={errors.paymentMethod?.message}>
              <Input placeholder="เงินสด / บัตรเครดิต / โอน" {...register("paymentMethod")} />
            </Field>
          </div>

          {/* รายการสินค้า/บริการ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">รายการสินค้า/บริการ</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                <Plus /> เพิ่มรายการ
              </Button>
            </div>
            {errors.items?.message && <p className="text-xs text-destructive">{errors.items.message}</p>}

            {fields.map((f, i) => {
              const e = errors.items?.[i];
              return (
                <div key={f.id} className="grid grid-cols-6 gap-2 rounded-lg border border-border/60 p-3 md:grid-cols-12">
                  <div className="col-span-2 md:col-span-1">
                    <Input placeholder="รหัส" {...register(`items.${i}.itemCode`)} />
                  </div>
                  <div className="col-span-4 md:col-span-4">
                    <Input placeholder="รายการ *" aria-invalid={!!e?.description} {...register(`items.${i}.description`)} />
                    {e?.description && <p className="mt-1 text-xs text-destructive">{e.description.message}</p>}
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Input type="number" step="0.01" placeholder="จำนวน" className="tabular" {...register(`items.${i}.quantity`)} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Input placeholder="หน่วย" {...register(`items.${i}.unit`)} />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <Input type="number" step="0.01" placeholder="ราคา/หน่วย" className="tabular" {...register(`items.${i}.unitPrice`)} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Input type="number" step="0.01" placeholder="ส่วนลด" className="tabular" {...register(`items.${i}.discount`)} />
                  </div>
                  <div className="col-span-3 flex items-center justify-end tabular font-medium md:col-span-1">
                    {formatNumber(lineTotalOf(items[i] ?? emptyItem))}
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="ลบรายการนี้"
                      disabled={fields.length === 1}
                      onClick={() => remove(i)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* สรุปยอด */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 md:gap-x-5">
            <Field label="ส่วนลดท้ายบิล (บาท)" error={errors.discount?.message}>
              <Input type="number" step="0.01" className="tabular" {...register("discount")} />
            </Field>
            <Field label="หมายเหตุ" error={errors.note?.message} className="col-span-2 md:col-span-2">
              <Input placeholder="เช่น รับประกันผลงาน 12 เดือน" {...register("note")} />
            </Field>
          </div>

          <div className="rounded-lg bg-muted/60 p-4 text-sm">
            <div className="flex justify-between">
              <span>รวมเงิน</span>
              <span className="tabular">{formatNumber(totals.subtotal)} บาท</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>หักส่วนลด</span>
              <span className="tabular">{formatNumber(Number(billDiscount) || 0)} บาท</span>
            </div>
            <div className="mt-1 flex justify-between text-base font-semibold">
              <span>รวมทั้งสิ้น</span>
              <span className="tabular">{formatNumber(totals.totalAmount)} บาท</span>
            </div>
            {scannedTotal !== null && Math.abs(scannedTotal - totals.totalAmount) > 0.01 && (
              <p className="mt-2 text-xs text-destructive">
                ยอดในใบเสร็จคือ {formatNumber(scannedTotal)} บาท ไม่ตรงกับยอดที่คำนวณ — กรุณาตรวจสอบรายการ
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {isEdit && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                <RotateCcw /> ยกเลิกการแก้ไข
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              <Save /> {isSubmitting ? "กำลังบันทึก…" : "บันทึก"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
