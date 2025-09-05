"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import "./globals.css";
import { Plus, Minus, Check, LeafyGreen, Star, AtSignIcon } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { DateTimePicker } from "@/components/date-time-picker";
import { SelectScrollable } from "@/components/ui/select-scrollable";
import { FloatingCart } from "@/components/floating-cart";
import { Database } from "@/types/database-generated";
import statesData from "@/data/states.json";

type Product = Database['public']['Tables']['products']['Row']
type Addon = Database['public']['Tables']['addons']['Row']

interface ProductWithQuantity extends Omit<Product, 'features'> {
  quantity: number;
  icon: React.ComponentType<{ className?: string }>;
  features: string | null;
  features_array: string[];
}

interface AddonWithSelection extends Addon {
  selected: boolean;
}

interface ContactInfo {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  poNumber: string;
  specialInstructions: string;
}

const states = statesData;

const getIconForType = (
  type: string
): React.ComponentType<{ className?: string }> => {
  return type.toLowerCase() === "starter" ? LeafyGreen : Star;
};

export default function PurchaseOrderPage() {
  const orderSummaryRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<ProductWithQuantity[]>([]);
  const [, setAddons] = useState<AddonWithSelection[]>([]);
  const [loading, setLoading] = useState(true);

  const [fulfillmentDate, setFulfillmentDate] = useState<Date>();
  const [selectedState, setSelectedState] = useState("CA");
  const [deliveryAddon, setDeliveryAddon] = useState<AddonWithSelection | null>(
    null
  );
  const [isDeliveryHovered, setIsDeliveryHovered] = useState(false);

  // Fetch products and addons from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch products
        const productsResponse = await fetch("/api/products");
        const productsData = await productsResponse.json();

        if (productsData.success) {
          const productsWithQuantity: ProductWithQuantity[] =
            productsData.data.map((product: Product) => ({
              ...product,
              quantity: 0,
              icon: getIconForType(product.type),
              features_array:
                typeof product.features === "string"
                  ? JSON.parse(product.features)
                  : product.features || [],
            }));
          setProducts(productsWithQuantity);
        }

        // Fetch addons
        const addonsResponse = await fetch("/api/addons");
        const addonsData = await addonsResponse.json();

        if (addonsData.success) {
          const addonsWithSelection: AddonWithSelection[] = addonsData.data.map(
            (addon: Addon) => ({
              ...addon,
              selected: false,
            })
          );
          setAddons(addonsWithSelection);

          // Find delivery addon
          const delivery = addonsWithSelection.find(
            (addon) => addon.name === "Delivery & Disposal"
          );
          if (delivery) {
            setDeliveryAddon(delivery);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    poNumber: "",
    specialInstructions: "",
  });

  const updateQuantity = (productId: string, newQuantity: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, quantity: Math.max(0, newQuantity) }
          : product
      )
    );
  };

  const calculateTotal = () => {
    const productTotal = products.reduce(
      (sum, product) => sum + product.price_per_bundle * product.quantity,
      0
    );
    const deliveryFee = deliveryAddon?.selected ? deliveryAddon.price : 0;
    return productTotal + deliveryFee;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products,
          contactInfo,
          fulfillmentDate,
          deliverySelected: deliveryAddon?.selected || false,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitMessage({
          type: "success",
          text: `Purchase order submitted successfully! Order ID: ${result.orderId}`,
        });
        // Reset form
        setProducts((prev) => prev.map((p) => ({ ...p, quantity: 0 })));
        setContactInfo({
          companyName: "",
          contactName: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          poNumber: "",
          specialInstructions: "",
        });
        setFulfillmentDate(undefined);
        if (deliveryAddon) {
          setDeliveryAddon({ ...deliveryAddon, selected: false });
        }
      } else {
        setSubmitMessage({
          type: "error",
          text: result.error || "Failed to submit purchase order",
        });
      }
    } catch {
      setSubmitMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[rgba(246,246,244,1)] grain-overlay">
      <div className="w-full h-5 md:h-12 px-4 md:px-15">
        <div className="w-full h-full px-3 border-x border-[rgba(217,231,247,1)]"></div>
      </div>
      <div className="h-fit border-y px-4 md:px-15 border-[rgba(217,231,247,1)]">
        <div className="w-full h-fit px-3 py-2 border-x bg-linear-to-r from-transparent via-blue-100/40 to-transparent flex justify-center items-center border-[rgba(217,231,247,1)]">
          <p className="text-sm text-center text-[rgba(5,81,207,1)]">
            All orders have a 4 day lead time. Rush orders incur an additional
            fee.
          </p>
        </div>
      </div>

      <div className="w-full px-4 md:px-15 border-b-[rgba(217,231,247,1)] border-solid bg-[repeating-linear-gradient(315deg,rgba(217,231,247,1)_0_1px,transparent_1px_6px)]">
        {/* Section 1: Header and Product Tiers */}
        <div className="flex w-full px-3 py-10 border border-x border-[rgba(217,231,247,1)] bg-[rgba(248,248,249,1)] flex-col items-center justify-start border-t-0 border-b-0 border-[rgba(217,231,247,1)] gap-6">
          <div className="flex-column w-full max-w-125 h-fit px-4 space-y-2.5">
            <p className="text-xl/4 text-center text-[rgba(77,84,97,1)] font-semibold">
              Purchase Order
            </p>
            <p className="text-sm/3 text-center text-[rgba(77,84,97,1)] text-base">
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {loading ? (
            <div className="w-full max-w-125 p-8 text-center">
              <p className="text-[rgba(127,138,148,1)]">Loading products...</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-125 space-y-4">
              <div className="w-full space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex-col p-4 md:p-6 space-y-4 border border-[rgba(217,231,247,1)] bg-[rgba(250,250,250,0.8)] rounded-lg gap-2.5">
                    <div className="flex w-full px-1 justify-between">
                      <div className="flex gap-1.5">
                        <product.icon className="w-4 h-4 stroke-2 text-[rgba(77,84,97,1)] self-center" />
                        <p className="text-sm font-medium text-[rgba(77,84,97,1)] self-center">
                          {product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                        </p>{" "}
                      </div>
                      <div className="flex w-fit space-x-0.5">
                        <p className="text-sm font-medium font-sans text-[rgba(5,81,207,1)] self-center">
                          ${product.price_per_bundle}
                        </p>
                        <p className="text-sm font-medium font-sans text-[rgba(5,81,207,1)] self-center">
                          /bundle
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-4 space-y-2 bg-blue-50/60 rounded-md border border-[rgba(217,231,247,1)]">
                      <h3 className="text-lg/4 text-[rgba(5,81,207,1)] font-medium">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm/3 text-[rgba(5,81,207,1)]">
                        {product.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 px-0 py-1.5 md:px-1">
                      {product.features_array.map((feature, index) => (
                        <div
                          key={index}
                          className="flex gap-x-1 md:gap-x-2 w-fit md:max-w-none">
                          <Check className="w-4 h-4 stroke-[1.5] md:w-5 md:h-5 md:stroke-[1.75] text-[rgba(77,84,97,1)] self-center" />
                          <span className="text-[rgba(77,84,97,1)] text-xs md:text-sm self-center">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="inline-flex w-full h-fit p-2 justify-between space-x-2 rounded-md bg-[rgba(249,249,249,1)] border border-[rgba(225,225,225,1)]">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-16 h-10 bg-white border rounded-md shadow shadow-[0px_2px_0px_0px_rgba(4,82,207,0.5)] hover:bg-blue-100 focus:outline-none disabled:opacity-50 border-[rgba(4,82,207,0.5)] cursor-pointer"
                        onClick={() =>
                          updateQuantity(product.id, product.quantity - 1)
                        }
                        disabled={product.quantity <= 0}>
                        <Minus className="w-5 h-5 text-[rgba(77,84,97,1)]" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={
                          product.quantity === 0
                            ? ""
                            : product.quantity.toString()
                        }
                        placeholder="0"
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string or valid numbers only
                          if (value === "" || /^[0-9]+$/.test(value)) {
                            const numValue =
                              value === "" ? 0 : Number.parseInt(value);
                            updateQuantity(product.id, numValue);
                          }
                        }}
                        className="w-full h-10 px-3 py-2 text-lg font-medium text-[rgba(77,84,97,1)] text-center bg-transparent focus:outline-none placeholder:text-[rgba(127,138,148,0.5)]"
                      />
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-16 h-10 bg-white border rounded-md shadow shadow-[0px_2px_0px_0px_rgba(4,82,207,0.5)] hover:bg-blue-100 focus:outline-none disabled:opacity-50 border-[rgba(4,82,207,0.5)] cursor-pointer"
                        onClick={() =>
                          updateQuantity(product.id, product.quantity + 1)
                        }>
                        <Plus className="w-5 h-5 text-[rgba(77,84,97,1)]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-col w-full max-w-125 p-4 md:p-6 border border-[rgba(217,231,247,1)] bg-[rgba(250,250,250,0.8)] rounded-lg gap-2.5 space-y-5">
                <div className="inline-flex space-x-1.5">
                  <AtSignIcon className="w-5 h-5 self-center text-[rgba(157,187,235,1)]" />
                  <h3 className="text-left text-lg font-medium text-[rgba(157,187,235,1)]">
                    Contact Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    label="Company Name"
                    type="text"
                    placeholder="Acme Corp"
                    value={contactInfo.companyName}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    required
                  />

                  <FormField
                    label="Contact Name"
                    type="text"
                    placeholder="John Doe"
                    value={contactInfo.contactName}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        contactName: e.target.value,
                      }))
                    }
                    required
                  />

                  <FormField
                    label="Email Address"
                    type="email"
                    placeholder="example@email.com"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />

                  <FormField
                    label="Phone Number"
                    type="tel"
                    placeholder="(000) 000-0000"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                  />

                  <div className="md:col-span-2">
                    <FormField
                      label="Business Address"
                      type="text"
                      placeholder="123 Industry Way"
                      value={contactInfo.address}
                      onChange={(e) =>
                        setContactInfo((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <FormField
                    label="City"
                    type="text"
                    placeholder="San Diego"
                    value={contactInfo.city}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    required
                  />

                  <div>
                    <label className="text-sm font-medium px-px text-[rgba(77,84,97,1)]">
                      State
                    </label>
                    <SelectScrollable
                      value={selectedState}
                      onValueChange={(value) => {
                        setSelectedState(value);
                        setContactInfo((prev) => ({ ...prev, state: value }));
                      }}
                      placeholder="Select a state"
                      className="mt-1 h-[40px] text-[rgba(77,84,97,1)] font-normal"
                      items={states}
                    />
                  </div>

                  <FormField
                    label="Zip Code"
                    type="text"
                    placeholder="92345"
                    value={contactInfo.zipCode}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        zipCode: e.target.value,
                      }))
                    }
                    required
                  />

                  <FormField
                    label="PO Number"
                    type="text"
                    placeholder="001"
                    value={contactInfo.poNumber}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        poNumber: e.target.value,
                      }))
                    }
                  />

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium px-px text-[rgba(77,84,97,1)]">
                      Requested Fulfillment Date
                    </label>
                    <DateTimePicker
                      date={fulfillmentDate}
                      onDateChange={setFulfillmentDate}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium px-px text-[rgba(77,84,97,1)]">
                      Special Instructions
                    </label>
                    <textarea
                      placeholder="Enter any special instructions or notes here"
                      value={contactInfo.specialInstructions}
                      onChange={(e) =>
                        setContactInfo((prev) => ({
                          ...prev,
                          specialInstructions: e.target.value,
                        }))
                      }
                      className="mt-1 w-full h-24 px-3 py-2 text-sm font-normal border border-gray-300 rounded-md focus:outline-[0.5px] focus:outline-blue-600 pointer-events-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col max-w-125 p-4 md:p-6 py-6 space-y-5 border border-green-200 rounded-lg items-center bg-linear-to-b from-[#B7FFE6] to-[#B7FFE6]/0">
                <div className="flex flex-col space-y-2 items-start">
                  <div className="inline-flex w-fit space-x-2">
                    <h3 className="px-1 font-semibold text-2xl tracking-tight text-[rgba(77,84,97,1)] self-center">
                      Delivery & Disposal
                    </h3>
                    <div className="rounded-full bg-[rgba(65,209,159,1)] py-0.5 px-2 border border-transparent text-xs text-white font-semibold self-center">
                      ADD-ON
                    </div>
                  </div>
                  <p className="mt-1 px-1 font-normal text-sm text-[rgba(143,149,160,1)]">
                    Full service delivery and pulp disposal. Help reduce waste
                    in landfills & contribute to enriching farmlands.
                  </p>
                </div>
                <div className="flex-col w-full space-y-1">
                  <button
                    type="button"
                    className={`w-full px-4 py-2 rounded-md font-medium transition-all duration-200 ease-out text-white border border-transparent bg-[rgba(65,209,159,1)] relative overflow-hidden cursor-pointer ${
                      deliveryAddon?.selected
                        ? "bg-[rgba(15,89,63,1)] hover:bg-emerald-300/25 hover:border-emerald-500 hover:text-emerald-500"
                        : "bg-[rgba(15,89,63,1)] hover:bg-emerald-300/25 hover:border-emerald-500 hover:text-emerald-500"
                    }`}
                    onClick={() =>
                      deliveryAddon &&
                      setDeliveryAddon({
                        ...deliveryAddon,
                        selected: !deliveryAddon.selected,
                      })
                    }
                    onMouseEnter={() => setIsDeliveryHovered(true)}
                    onMouseLeave={() => setIsDeliveryHovered(false)}>
                    <span
                      key={`${deliveryAddon?.selected}-${isDeliveryHovered}`}
                      className="inline-block transition-all duration-300 ease-out">
                      {deliveryAddon?.selected
                        ? "Remove"
                        : isDeliveryHovered
                        ? "Add to Order"
                        : `$${deliveryAddon?.price || 0} /order`}
                    </span>
                  </button>
                  <p className="px-3 mt-2 text-xs text-center font-medium text-[rgba(143,149,160,1)]">
                    Must be within 50 miles of 92003
                  </p>
                </div>
              </div>

              {/* Order Summary - Restored */}
              <div
                ref={orderSummaryRef}
                className="flex-col w-full max-w-125 p-4 md:p-6 border border-[rgba(217,231,247,1)] bg-[rgba(250,250,250,0.8)] rounded-lg gap-2.5">
                <h3 className="px-1 font-semibold text-2xl tracking-tight text-[rgba(77,84,97,1)] self-center">
                  Order Summary
                </h3>
                <div className="flex-col px-1 py-2">
                  <div className="flex justify-between py-4">
                    <span className="font-medium text-[rgba(127,138,148,1)] text-sm">
                      Item
                    </span>
                    <span className="font-medium text-[rgba(127,138,148,1)] text-sm">
                      Cost
                    </span>
                  </div>
                  <div className="border-b border-gray-200"></div>
                  {(() => {
                    const visibleProducts = products.filter(
                      (product) => product.quantity > 0
                    );
                    const hasDelivery = deliveryAddon?.selected || false;

                    return (
                      <>
                        {visibleProducts.map((product, index) => (
                          <div key={product.id} className="">
                            <div className="flex justify-between py-4">
                              <div className="flex flex-col">
                                <span className="w-fit font-medium text-sm text-[rgba(77,84,97,1)]">
                                  {product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                                </span>
                                <span className="text-xs text-[rgba(127,138,148,1)] self-center">
                                  {product.quantity} bundle
                                  {product.quantity !== 1 ? "s" : ""} @ $
                                  {product.price_per_bundle}
                                </span>
                              </div>
                              <span className="font-medium self-center text-[rgba(77,84,97,1)] text-sm">
                                ${product.price_per_bundle * product.quantity}
                              </span>
                            </div>
                            {/* Add separator line only if there are more items after this one */}
                            {index < visibleProducts.length - 1 ||
                            hasDelivery ? (
                              <div className="border-b border-gray-200"></div>
                            ) : null}
                          </div>
                        ))}

                        {deliveryAddon?.selected && (
                          <div className="space-y-1">
                            <div className="flex justify-between py-4">
                              <div className="flex flex-col">
                                <span className="w-fit font-medium text-sm text-[rgba(77,84,97,1)]">
                                  Delivery & Disposal
                                </span>
                                {fulfillmentDate && (
                                  <span className="text-xs text-[rgba(127,138,148,1)]">
                                    {fulfillmentDate.toLocaleDateString(
                                      "en-US",
                                      {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      }
                                    )}{" "}
                                    @{" "}
                                    {fulfillmentDate.toLocaleTimeString(
                                      "en-US",
                                      {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                      }
                                    )}
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-[rgba(77,84,97,1)] text-sm self-center">
                                ${deliveryAddon?.price}
                              </span>
                            </div>
                            {/* No separator line after the last item */}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {submitMessage && (
                  <div
                    className={`p-4 rounded-md mb-4 ${
                      submitMessage.type === "success"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}>
                    <p
                      className={`text-sm ${
                        submitMessage.type === "success"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}>
                      {submitMessage.text}
                    </p>
                  </div>
                )}

                <div className="">
                  <div className="flex justify-between px-1 py-2">
                    <span className="text-[rgba(77,84,97,1)] font-semibold text-sm">
                      Order Total
                    </span>
                    <span className="font-semibold text-[rgba(77,84,97,1)] text-sm tracking-tight">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[rgba(4,82,207,1)] text-white py-2 px-4 rounded-md font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>

                  <p className="text-xs text-center px-2 py-2 text-[rgba(127,138,148,1)]">
                    This is a purchase order submission. You will receive an
                    email upon approval.
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Floating Cart */}
      <FloatingCart
        products={products}
        deliverySelected={deliveryAddon?.selected || false}
        total={calculateTotal()}
        orderSummaryRef={orderSummaryRef}
      />

      <div className="w-full h-4 px-4 md:px-15 border-y border-[rgba(217,231,247,1)]">
        <div className="w-full h-full border-x border-[rgba(217,231,247,1)] bg-[repeating-linear-gradient(315deg,rgba(217,231,247,1)_0_1px,transparent_1px_6px)] bg-[rgba(248,248,249,1)]"></div>
      </div>
    </div>
  );
}
