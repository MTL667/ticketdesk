"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface SimpleTicketFormProps {
  userEmail: string;
}

export function SimpleTicketForm({ userEmail }: SimpleTicketFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "3" as "1" | "2" | "3" | "4", // 1=urgent, 2=high, 3=normal, 4=low
  });

  const [files, setFiles] = useState<File[]>([]);

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
      setFiles((prev) => [...prev, ...selectedFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Onderwerp is verplicht");
      return;
    }
    if (!formData.description.trim()) {
      setError("Beschrijving is verplicht");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("priority", formData.priority);
      submitData.append("email", userEmail); // Automatisch ingevuld!

      files.forEach((file) => {
        submitData.append("attachments", file);
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

      {/* Email (readonly) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Uw E-mailadres
        </label>
        <input
          type="email"
          value={userEmail}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          Dit email adres wordt automatisch toegevoegd aan uw ticket
        </p>
      </div>

      {/* Onderwerp */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Onderwerp / Sujet <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          placeholder="Korte omschrijving van het probleem"
        />
      </div>

      {/* Beschrijving */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beschrijving / Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          placeholder="Geef een uitgebreide beschrijving van uw vraag of probleem"
        />
      </div>

      {/* Prioriteit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prioriteit / Priorité
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1">Urgent</option>
          <option value="2">Hoog / High</option>
          <option value="3">Normaal / Normal</option>
          <option value="4">Laag / Low</option>
        </select>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bijlagen / Pièces jointes (optioneel)
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
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
              >
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
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? "Bezig met verzenden..." : "Ticket Aanmaken"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}

