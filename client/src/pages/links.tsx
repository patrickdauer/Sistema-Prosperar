import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Link, Edit, Trash2, Plus, ExternalLink, Search, Tag, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LinksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [editingLink, setEditingLink] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    description: '',
    category: 'geral',
    tags: '',
    isFavorite: false
  });

  // Mock data - replace with real API calls
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['/api/links'],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          id: 1,
          title: 'Portal do Simples Nacional',
          url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/',
          description: 'Portal oficial do Simples Nacional da Receita Federal',
          category: 'governo',
          tags: ['receita', 'simples', 'nacional'],
          isFavorite: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Portal do Empreendedor',
          url: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor',
          description: 'Portal oficial do empreendedor do governo federal',
          category: 'governo',
          tags: ['mei', 'empreendedor'],
          isFavorite: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Sistema DAS-MEI',
          url: '/das-mei',
          description: 'Sistema interno de gestão DAS-MEI',
          category: 'interno',
          tags: ['das', 'mei', 'sistema'],
          isFavorite: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
  });

  const categories = [
    { value: 'todos', label: 'Todos' },
    { value: 'governo', label: 'Governo' },
    { value: 'interno', label: 'Interno' },
    { value: 'cliente', label: 'Cliente' },
    { value: 'ferramenta', label: 'Ferramenta' },
    { value: 'geral', label: 'Geral' }
  ];

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'todos' || link.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLink) {
      // Update existing link
      toast({
        title: "Link atualizado",
        description: "O link foi atualizado com sucesso.",
      });
    } else {
      // Create new link
      toast({
        title: "Link criado",
        description: "O link foi criado com sucesso.",
      });
    }
    
    setIsDialogOpen(false);
    setEditingLink(null);
    setLinkForm({
      title: '',
      url: '',
      description: '',
      category: 'geral',
      tags: '',
      isFavorite: false
    });
  };

  const handleEdit = (link: any) => {
    setEditingLink(link);
    setLinkForm({
      title: link.title,
      url: link.url,
      description: link.description,
      category: link.category,
      tags: link.tags.join(', '),
      isFavorite: link.isFavorite
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (linkId: number) => {
    toast({
      title: "Link removido",
      description: "O link foi removido com sucesso.",
    });
  };

  const toggleFavorite = (linkId: number) => {
    toast({
      title: "Favorito atualizado",
      description: "O status de favorito foi atualizado.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-green-400 mb-2">Central de Links</h1>
          <p className="text-gray-400">Organize e gerencie seus links importantes</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Link
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-green-400">
                  {editingLink ? 'Editar Link' : 'Novo Link'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={linkForm.title}
                    onChange={(e) => setLinkForm({...linkForm, title: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({...linkForm, url: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={linkForm.description}
                    onChange={(e) => setLinkForm({...linkForm, description: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={linkForm.category} 
                    onValueChange={(value) => setLinkForm({...linkForm, category: value})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={linkForm.tags}
                    onChange={(e) => setLinkForm({...linkForm, tags: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFavorite"
                    checked={linkForm.isFavorite}
                    onChange={(e) => setLinkForm({...linkForm, isFavorite: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="isFavorite">Marcar como favorito</Label>
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  {editingLink ? 'Atualizar' : 'Criar'} Link
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <Card key={link.id} className="bg-gray-800 border-gray-700 hover:border-green-500 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-green-400" />
                    <CardTitle className="text-white text-sm">{link.title}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    {link.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(link.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Star className={`w-3 h-3 ${link.isFavorite ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-300 text-xs mb-3">{link.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                    {categories.find(c => c.value === link.category)?.label}
                  </Badge>
                  {link.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="border-gray-600 text-gray-400 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (link.url.startsWith('http')) {
                        window.open(link.url, '_blank');
                      } else {
                        window.location.href = link.url;
                      }
                    }}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(link)}
                    className="border-gray-600 text-gray-300"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(link.id)}
                    className="border-gray-600 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLinks.length === 0 && (
          <div className="text-center py-12">
            <Link className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhum link encontrado</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory !== 'todos' 
                ? 'Tente ajustar seus filtros de busca'
                : 'Comece adicionando seu primeiro link'
              }
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}