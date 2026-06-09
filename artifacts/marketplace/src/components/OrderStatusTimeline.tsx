import { type ElementType } from "react";
import {
  CheckCircle2, Circle, Clock, Package, Truck, Home, XCircle, MapPin, User,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useGetOrderHistory, getGetOrderHistoryQueryKey } from "@workspace/api-client-react";
import type { OrderHistoryEntry } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export type OrderStatus =
  | "pending" | "confirmed" | "processing" | "preparing"
  | "ready_for_pickup" | "courier_assigned"
  | "shipped" | "picked_up" | "in_transit"
  | "delivered" | "cancelled" | "refunded";

interface OrderStatusTimelineProps {
  orderId: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  deliveryFee?: number | null;
}

// ── Two possible flows: Internal Delivery and External Shipping ────────────────
// Internal: pending → processing → ready_for_pickup → courier_assigned → picked_up → delivered
// External: pending → processing → shipped → delivered
// We detect which flow is active from the order status.

const DELIVERY_STEPS: { key: string; icon: ElementType; i18nKey: string }[] = [
  { key: "pending",          icon: Clock,    i18nKey: "orders.step_pending" },
  { key: "processing",       icon: Package,  i18nKey: "orders.step_processing" },
  { key: "ready_for_pickup", icon: MapPin,   i18nKey: "orders.step_ready_for_pickup" },
  { key: "courier_assigned", icon: User,     i18nKey: "orders.step_courier_assigned" },
  { key: "picked_up",        icon: Truck,    i18nKey: "orders.step_picked_up" },
  { key: "delivered",        icon: Home,     i18nKey: "orders.step_delivered" },
];

const SHIPPING_STEPS: { key: string; icon: ElementType; i18nKey: string }[] = [
  { key: "pending",    icon: Clock,   i18nKey: "orders.step_pending" },
  { key: "processing", icon: Package, i18nKey: "orders.step_processing" },
  { key: "shipped",    icon: Truck,   i18nKey: "orders.step_shipped" },
  { key: "delivered",  icon: Home,    i18nKey: "orders.step_delivered" },
];

const DELIVERY_STATUS_ORDER: Record<string, number> = {
  pending:          0,
  confirmed:        0,
  processing:       1,
  preparing:        1,
  ready_for_pickup: 2,
  courier_assigned: 3,
  picked_up:        4,
  in_transit:       4,
  delivered:        5,
  cancelled:        -1,
  refunded:         -2,
};

const SHIPPING_STATUS_ORDER: Record<string, number> = {
  pending:    0,
  confirmed:  0,
  processing: 1,
  preparing:  1,
  shipped:    2,
  delivered:  3,
  cancelled:  -1,
  refunded:   -2,
};

function isDeliveryFlow(status: OrderStatus): boolean {
  return ["ready_for_pickup", "courier_assigned", "picked_up", "in_transit"].includes(status);
}

function isShippingFlow(status: OrderStatus): boolean {
  return ["shipped"].includes(status);
}

export function OrderStatusTimeline({ orderId, status, createdAt, updatedAt, deliveryFee }: OrderStatusTimelineProps) {
  const { t } = useTranslation();

  const { data: history } = useGetOrderHistory(orderId, {
    query: { enabled: !!orderId, queryKey: getGetOrderHistoryQueryKey(orderId) }
  });

  const isCancelled = status === "cancelled";
  const isRefunded  = status === "refunded";

  // Pick the right flow: if status hints delivery flow, use it; else use shipping
  const useDelivery = isDeliveryFlow(status);
  const STEPS = useDelivery ? DELIVERY_STEPS : SHIPPING_STEPS;
  const STATUS_ORDER = useDelivery ? DELIVERY_STATUS_ORDER : SHIPPING_STATUS_ORDER;
  const currentIndex = STATUS_ORDER[status] ?? 0;

  function getTimestampFromHistory(stepKey: string): string | null {
    if (!history || history.length === 0) return null;
    // Check both the key and its synonyms
    const synonyms: Record<string, string[]> = {
      processing:       ["processing", "confirmed", "preparing"],
      ready_for_pickup: ["ready_for_pickup"],
      courier_assigned: ["courier_assigned"],
      picked_up:        ["picked_up", "in_transit"],
      shipped:          ["shipped"],
      delivered:        ["delivered"],
      pending:          ["pending"],
    };
    const targets = synonyms[stepKey] ?? [stepKey];
    const entry = history.find((h: OrderHistoryEntry) => targets.includes(h.toStatus));
    if (entry) return format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a");
    return null;
  }

  function getFallbackTimestamp(stepIndex: number): string | null {
    if (isCancelled || isRefunded) return null;
    if (stepIndex === 0) return format(new Date(createdAt), "MMM d, yyyy 'at' h:mm a");
    if (stepIndex <= currentIndex) return format(new Date(updatedAt), "MMM d, yyyy 'at' h:mm a");
    return null;
  }

  function getTimestamp(stepKey: string, stepIndex: number): string | null {
    const fromHistory = getTimestampFromHistory(stepKey);
    if (fromHistory) return fromHistory;
    return getFallbackTimestamp(stepIndex);
  }

  const cancelledEntry = history?.find((h: OrderHistoryEntry) => h.toStatus === "cancelled");

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="font-semibold text-base">{t("orders.timeline_title")}</h3>
        {deliveryFee != null && deliveryFee > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {t("orders.delivery_fee")}: ${deliveryFee.toFixed(2)}
          </span>
        )}
      </div>

      <div className="p-6">
        {isCancelled ? (
          <div className="flex items-center gap-3 text-destructive">
            <XCircle className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-semibold text-sm">{t("orders.status_cancelled")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cancelledEntry
                  ? format(new Date(cancelledEntry.createdAt), "MMM d, yyyy 'at' h:mm a")
                  : format(new Date(updatedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        ) : isRefunded ? (
          <div className="flex items-center gap-3" style={{ color: "#8B5CF6" }}>
            <XCircle className="h-6 w-6 shrink-0" style={{ color: "#8B5CF6" }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: "#8B5CF6" }}>{t("orders.status_refunded")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(updatedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        ) : (
          <ol className="relative">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isPending = idx > currentIndex;
              const isLast = idx === STEPS.length - 1;
              const timestamp = getTimestamp(step.key, idx);
              const Icon = step.icon;

              return (
                <li key={step.key} className={cn("relative flex gap-4", !isLast && "pb-6")}>
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute start-[15px] top-7 bottom-0 w-0.5",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}

                  <div className="shrink-0 relative z-10">
                    {isCompleted ? (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                      </div>
                    ) : isCurrent ? (
                      <div className="h-8 w-8 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full border-2 border-border bg-background flex items-center justify-center">
                        <Circle className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <p
                      className={cn(
                        "text-sm font-semibold leading-none",
                        isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {t(step.i18nKey)}
                    </p>
                    {timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
                    )}
                    {isCurrent && !timestamp && (
                      <p className="text-xs text-primary mt-1 font-medium">{t("orders.step_current")}</p>
                    )}
                    {isPending && (
                      <p className="text-xs text-muted-foreground/60 mt-1">{t("orders.step_pending_label")}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
