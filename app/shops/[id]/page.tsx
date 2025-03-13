<div className="container mx-auto p-6">
  <Card>
    <CardHeader>
      <CardTitle>Detail e-shopu</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label>ID e-shopu</Label>
          <div className="text-sm text-gray-600 mt-1">{shop.id}</div>
        </div>
        <div>
          <Label>Název</Label>
          <div className="text-sm text-gray-600 mt-1">{shop.name}</div>
        </div>
        <div>
          <Label>Sektor zboží</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Vyberte sektor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alcohol">Alkohol</SelectItem>
              <SelectItem value="tobacco">Tabákové výrobky</SelectItem>
              <SelectItem value="adult">Adult content</SelectItem>
              <SelectItem value="other">Ostatní</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
</div> 