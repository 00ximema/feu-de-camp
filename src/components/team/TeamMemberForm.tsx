
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamMemberFormData {
  nom: string;
  prenom: string;
  age: string;
  telephone: string;
  email: string;
  role: string;
  diplomes: string;
  notes: string;
}

interface TeamMemberFormProps {
  formData: TeamMemberFormData;
  onFormDataChange: (data: TeamMemberFormData) => void;
  onSubmit: () => void;
  roles: string[];
}

const TeamMemberForm = ({ formData, onFormDataChange, onSubmit, roles }: TeamMemberFormProps) => {
  const handleNumericInput = (value: string, field: 'age' | 'telephone') => {
    const numericValue = value.replace(/[^0-9]/g, '');
    onFormDataChange({ ...formData, [field]: numericValue });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nom">Nom de famille</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => onFormDataChange({ ...formData, nom: e.target.value.toUpperCase() })}
          />
        </div>
        <div>
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={formData.prenom}
            onChange={(e) => onFormDataChange({ ...formData, prenom: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="age">Âge</Label>
          <Input
            id="age"
            value={formData.age}
            onChange={(e) => handleNumericInput(e.target.value, 'age')}
            placeholder="25"
          />
        </div>
        <div>
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            value={formData.telephone}
            onChange={(e) => handleNumericInput(e.target.value, 'telephone')}
            placeholder="0123456789"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="role">Rôle</Label>
        <Select value={formData.role} onValueChange={(value) => onFormDataChange({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un rôle" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="diplomes">Diplômes</Label>
        <Input
          id="diplomes"
          value={formData.diplomes}
          onChange={(e) => onFormDataChange({ ...formData, diplomes: e.target.value })}
          placeholder="BAFA, BAFD... (séparés par des virgules)"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
          placeholder="Informations complémentaires..."
        />
      </div>
      <Button 
        className="w-full"
        disabled={!formData.nom || !formData.prenom || !formData.age || !formData.role}
        onClick={onSubmit}
      >
        Ajouter le membre
      </Button>
    </div>
  );
};

export default TeamMemberForm;
