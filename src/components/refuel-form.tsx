"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fuel, Plus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THAI_PROVINCES } from "@/lib/constants";
import { refuelInputSchema, type RefuelInput } from "@/lib/validations";
import { api } from "@/lib/api-client";
import { formatNumber } from "@/lib/format";
import type { RefuelDto, StationDto } from "@/types/refuel";

interface Props {
  stations: StationDto[];
  editing?: RefuelDto | null;
  onSaved: () => void;
  onCancelEdit?: () => void;
}

const emptyValues: RefuelInput = {
  refuelDate: new Date().toISOString().slice(0, 10),
  stationId: "",
  province: "",
  pricePerLiter: 0,
  amount: 0,
  odometer: null,
  note: "",
};

export function RefuelForm({ stations, editing, onSaved, onCancelEdit }: Props) {
  const isEdit = Boolean(editing);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RefuelInput>({
    resolver: zodResolver(refuelInputSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (editing) {
      reset({
        refuelDate: editing.refuelDate,
        stationId: editing.station.id,
        province: editing.province,
        pricePerLiter: editing.pricePerLiter,
        amount: editing.amount,
        odometer: editing.odometer,
        note: editing.note ?? "",
      });
    } else {
      reset(emptyValues);
    }
  }, [editing, reset]);

  const price = Number(watch("pricePerLiter"));
  const amount = Number(watch("amount"));
  const stationId = watch("stationId");
  const province = watch("province");

  // ปริมาณเติม = จำนวนเงิน / ราคาต่อลิตร (คำนวณให้อัตโนมัติ)
  const liters = useMemo(() => {
    if (!price || !amount || price <= 0) return null;
    return amount / price;
  }, [price, amount]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && editing) {
        await api.updateRefuel(editing.id, values);
        toast.success("แก้ไขรายการแล้ว");
      } else {
        await api.createRefuel(values);
        toast.success("เพิ่มรายการแล้ว");
      }
      reset(emptyValues);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  });

  const handleCancel = () => {
    reset(emptyValues);
    onCancelEdit?.();
  };

  return (
    <Card className="no-print">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="size-4" />
          {isEdit ? "แก้ไขรายการเติมน้ำมัน" : "เพิ่มข้อมูลใหม่"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-3" noValidate>
          {/* วันที่ */}
          <Field label="วันที่เติมน้ำมัน" required error={errors.refuelDate?.message}>
            <Input
              type="date"
              className="tabular"
              aria-invalid={!!errors.refuelDate}
              {...register("refuelDate")}
            />
          </Field>

          {/* สถานี */}
          <Field label="ชื่อสถานีบริการ" required error={errors.stationId?.message}>
            <Select
              value={stationId}
              onValueChange={(v) => setValue("stationId", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.stationId}>
                <SelectValue placeholder="เลือกสถานีบริการ" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nameTh} ({s.nameEn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* จังหวัด */}
          <Field label="จังหวัด" required error={errors.province?.message}>
            <Select
              value={province}
              onValueChange={(v) => setValue("province", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.province}>
                <SelectValue placeholder="เลือกจังหวัด" />
              </SelectTrigger>
              <SelectContent>
                {THAI_PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* ราคา/ลิตร */}
          <Field label="ราคาเชื้อเพลิง (บาท/ลิตร)" required error={errors.pricePerLiter?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              className="tabular"
              aria-invalid={!!errors.pricePerLiter}
              {...register("pricePerLiter")}
            />
          </Field>

          {/* จำนวนเงิน */}
          <Field label="จำนวนเงินที่เติม (บาท)" required error={errors.amount?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              className="tabular"
              aria-invalid={!!errors.amount}
              {...register("amount")}
            />
          </Field>

          {/* ปริมาณ (คำนวณอัตโนมัติ) */}
          <Field label="ปริมาณเติม (ลิตร)" hint="คำนวณจากจำนวนเงิน ÷ ราคาต่อลิตร">
            <Input
              readOnly
              tabIndex={-1}
              className="tabular"
              placeholder="คำนวณอัตโนมัติ"
              value={liters === null ? "" : formatNumber(liters, 2)}
            />
          </Field>

          {/* เลขไมล์ */}
          <Field
            label="เลขไมล์รถ (กม.)"
            hint="ใส่ไว้เพื่อให้ระบบคำนวณอัตราสิ้นเปลืองได้"
            error={errors.odometer?.message}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="เช่น 45230"
              className="tabular"
              aria-invalid={!!errors.odometer}
              {...register("odometer", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
            />
          </Field>

          {/* หมายเหตุ */}
          <Field label="หมายเหตุ" error={errors.note?.message} className="md:col-span-2">
            <Input placeholder="เช่น เติมเต็มถัง ก่อนขึ้นเขา" {...register("note")} />
          </Field>

          <div className="flex items-center justify-center gap-3 pt-1 md:col-span-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              <RotateCcw />
              {isEdit ? "ยกเลิกการแก้ไข" : "ล้างฟอร์ม"}
            </Button>
            <Button type="submit" variant="success" disabled={isSubmitting}>
              {isEdit ? <Save /> : <Plus />}
              {isSubmitting ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
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
  hint,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
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
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
