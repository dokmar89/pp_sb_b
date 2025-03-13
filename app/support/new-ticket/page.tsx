<div className="container mx-auto p-6">
  <Card>
    <CardHeader>
      <CardTitle>Nový ticket</CardTitle>
    </CardHeader>
    <CardContent>
      <form className="space-y-6">
        <div>
          <Label>E-shop</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Vyberte e-shop" />
            </SelectTrigger>
            <SelectContent>
              {shops.map(shop => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Kategorie problému</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Vyberte kategorii" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Technický problém</SelectItem>
              <SelectItem value="billing">Fakturace</SelectItem>
              <SelectItem value="integration">Integrace</SelectItem>
              <SelectItem value="other">Ostatní</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Existující pole */}
      </form>
    </CardContent>
  </Card>
</div> 