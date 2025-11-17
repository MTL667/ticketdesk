"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { TicketFormData } from "@/types";

interface FieldOption {
  value: string;
  label: string;
}

interface FieldsData {
  typeVraag: FieldOption[];
  gebouw: FieldOption[];
  toepassingsgebied: FieldOption[];
  fieldIds: {
    typeVraag?: string;
    gebouw?: string;
    toepassingsgebied?: string;
    requesterEmail?: string;
  };
}

// Fallback options if API fails
const FALLBACK_TYPE_VRAAG = [
  { value: "damage", label: "Schade & problemen / Dommages et problèmes" },
  { value: "new", label: "Nieuwe vraag / Nouvelle demande" },
  { value: "info", label: "Informatie / Information" },
  { value: "other", label: "Andere / Autres" },
];

const FALLBACK_GEBOUW = [
  { value: "strombeek-bever", label: "Strombeek-Bever" },
  { value: "destelbergen", label: "Destelbergen" },
  { value: "utrecht", label: "Utrecht" },
  { value: "aceg-drive-in", label: "ACEG Drive-in" },
  { value: "other", label: "Andere / Autres" },
];

const FALLBACK_TOEPASSINGSGEBIED = [
  { value: "werkplek", label: "Werkplek / Lieu de travail" },
  { value: "gebouwschil", label: "Gebouwschil / Enveloppe du bâtiment" },
  { value: "sanitair", label: "Sanitair / Sanitaire" },
  { value: "elektriciteit", label: "Elektriciteit / Électricité" },
  { value: "keuken", label: "Keuken / Cuisine" },
  { value: "verwarming", label: "Verwarming / Chauffage" },
  { value: "drank-koffie", label: "Drank/koffie / Boissons/Café" },
  { value: "parking", label: "Parking" },
  { value: "other", label: "Andere / Autres" },
];

export function TicketForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [formData, setFormData] = useState<TicketFormData>({
    typeVraag: "",
    gebouw: "",
    toepassingsgebied: "",
    korteOmschrijving: "",
    volledigeOmschrijving: "",
    prioriteit: "normal",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [fieldsData, setFieldsData] = useState<FieldsData>({
    typeVraag: FALLBACK_TYPE_VRAAG,
    gebouw: FALLBACK_GEBOUW,
    toepassingsgebied: FALLBACK_TOEPASSINGSGEBIED,
    fieldIds: {},
  });

  // Load custom fields from ClickUp
  useEffect(() => {
    async function loadFields() {
      try {
        const response = await fetch("/api/fields");
        if (response.ok) {
          const data = await response.json();
          // Only use ClickUp fields if they have options, otherwise use fallback
          setFieldsData({
            typeVraag: data.typeVraag.length > 0 ? data.typeVraag : FALLBACK_TYPE_VRAAG,
            gebouw: data.gebouw.length > 0 ? data.gebouw : FALLBACK_GEBOUW,
            toepassingsgebied: data.toepassingsgebied.length > 0 ? data.toepassingsgebied : FALLBACK_TOEPASSINGSGEBIED,
            fieldIds: data.fieldIds,
          });
        }
      } catch (err) {
        console.error("Failed to load custom fields, using fallback:", err);
        // Keep using fallback values
      } finally {
        setIsLoadingFields(false);
      }
    }
    loadFields();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (files.length + selectedFiles.length > 5) {
        setError("Maximum 5 bestanden toegestaan");
        return;
      }
      // Check file sizes (max 10MB each)
      for (const file of selectedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`Bestand ${file.name} is te groot (max 10MB)`);
          return;
        }
      }
      setFiles((prev) => [...prev, ...selectedFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!formData.typeVraag) {
      setError("Type vraag / Type de demande is verplicht");
      return false;
    }
    if (formData.typeVraag === "other" && !formData.typeVraagOther) {
      setError("Gelieve de andere type vraag in te vullen");
      return false;
    }
    if (!formData.gebouw) {
      setError("Gebouw / Bâtiment is verplicht");
      return false;
    }
    if (formData.gebouw === "other" && !formData.gebouwOther) {
      setError("Gelieve het andere gebouw in te vullen");
      return false;
    }
    if (!formData.toepassingsgebied) {
      setError("Toepassingsgebied / Application is verplicht");
      return false;
    }
    if (formData.toepassingsgebied === "other" && !formData.toepassingsgebiedOther) {
      setError("Gelieve het andere toepassingsgebied in te vullen");
      return false;
    }
    if (!formData.korteOmschrijving.trim()) {
      setError("Korte omschrijving / Titre is verplicht");
      return false;
    }
    if (!formData.volledigeOmschrijving.trim()) {
      setError("Volledige omschrijving / Description complète is verplicht");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("typeVraag", formData.typeVraag);
      if (formData.typeVraagOther) {
        submitData.append("typeVraagOther", formData.typeVraagOther);
      }
      submitData.append("gebouw", formData.gebouw);
      if (formData.gebouwOther) {
        submitData.append("gebouwOther", formData.gebouwOther);
      }
      submitData.append("toepassingsgebied", formData.toepassingsgebied);
      if (formData.toepassingsgebiedOther) {
        submitData.append("toepassingsgebiedOther", formData.toepassingsgebiedOther);
      }
      submitData.append("korteOmschrijving", formData.korteOmschrijving);
      submitData.append("volledigeOmschrijving", formData.volledigeOmschrijving);
      submitData.append("prioriteit", formData.prioriteit);

      files.forEach((file, index) => {
        submitData.append(`attachment_${index}`, file);
      });

      const response = await fetch("/api/tickets", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Er is een fout opgetreden");
      }

      router.push("/tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Type vraag / Type de demande */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type vraag / Type de demande <span className="text-red-500">*</span>
        </label>
        <select
          name="typeVraag"
          value={formData.typeVraag}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoadingFields}
        >
          <option value="">{isLoadingFields ? "Laden..." : "Selecteer..."}</option>
          {fieldsData.typeVraag.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {formData.typeVraag === "other" && (
          <input
            type="text"
            name="typeVraagOther"
            value={formData.typeVraagOther || ""}
            onChange={handleInputChange}
            placeholder="Specificeer type vraag / Spécifiez le type de demande"
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        )}
      </div>

      {/* Gebouw / Bâtiment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gebouw / Bâtiment <span className="text-red-500">*</span>
        </label>
        <select
          name="gebouw"
          value={formData.gebouw}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoadingFields}
        >
          <option value="">{isLoadingFields ? "Laden..." : "Selecteer..."}</option>
          {fieldsData.gebouw.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {formData.gebouw === "other" && (
          <input
            type="text"
            name="gebouwOther"
            value={formData.gebouwOther || ""}
            onChange={handleInputChange}
            placeholder="Specificeer gebouw / Spécifiez le bâtiment"
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        )}
      </div>

      {/* Toepassingsgebied / Application */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Toepassingsgebied / Application <span className="text-red-500">*</span>
        </label>
        <select
          name="toepassingsgebied"
          value={formData.toepassingsgebied}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoadingFields}
        >
          <option value="">{isLoadingFields ? "Laden..." : "Selecteer..."}</option>
          {fieldsData.toepassingsgebied.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {formData.toepassingsgebied === "other" && (
          <input
            type="text"
            name="toepassingsgebiedOther"
            value={formData.toepassingsgebiedOther || ""}
            onChange={handleInputChange}
            placeholder="Specificeer toepassingsgebied / Spécifiez l'application"
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        )}
      </div>

      {/* Korte omschrijving / Titre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Korte omschrijving / Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="korteOmschrijving"
          value={formData.korteOmschrijving}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Volledige omschrijving / Description complète */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Volledige omschrijving / Description complète <span className="text-red-500">*</span>
        </label>
        <textarea
          name="volledigeOmschrijving"
          value={formData.volledigeOmschrijving}
          onChange={handleInputChange}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Prioriteit / Priorité */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prioriteit / Priorité <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {(["urgent", "high", "normal", "low"] as const).map((priority) => (
            <label key={priority} className="flex items-center">
              <input
                type="radio"
                name="prioriteit"
                value={priority}
                checked={formData.prioriteit === priority}
                onChange={handleInputChange}
                className="mr-2"
                required
              />
              <span className="capitalize">{priority}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Optioneel: bijlagen, foto&apos;s / Facultatif: pièces jointes, photos
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          accept="image/*,.pdf,.doc,.docx"
        />
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Verwijderen
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Maximum 5 bestanden, elk maximaal 10MB
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Bezig met verzenden..." : "Ticket aanmaken"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/tickets")}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}


