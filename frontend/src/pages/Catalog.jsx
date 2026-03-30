import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Tag, Box, AlertCircle, Loader2 } from 'lucide-react';
import phpApi from '../config/phpApi';

const categoryColors = {
    Electronics:  'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
    Furniture:    'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
    Footwear:     'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300',
    Accessories:  'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-300',
    Sports:       'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
};

const ProductCard = ({ product }) => {
    const colors = categoryColors[product.category] || 'from-slate-500/20 to-slate-400/20 border-slate-500/30 text-slate-300';

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/25 hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
            {/* Product Image */}
            <div className="relative h-48 overflow-hidden bg-slate-800">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300/1e293b/94a3b8?text=No+Image'; }}
                />
                <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r border backdrop-blur-md ${colors}`}>
                        {product.category}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
                <h3 className="text-white font-semibold text-base leading-snug mb-3 line-clamp-2">
                    {product.name}
                </h3>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <Tag className="w-4 h-4" />
                        <span className="text-xl font-bold">${Number(product.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Box className="w-4 h-4" />
                        <span>{product.stock} in stock</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Catalog = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await phpApi.get('/products');
                setProducts(data);
            } catch (err) {
                if (err.response?.status === 401) {
                    setError('Authentication failed. Please log out and log back in.');
                } else {
                    setError(err.response?.data?.error || 'Failed to load products from PHP API.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Ambient blobs */}
            <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-violet-600/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30 text-white">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Product Catalog</h1>
                            <p className="text-slate-400 text-sm mt-0.5">
                                Served by PHP microservice · JWT authenticated
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Loading state */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                        <p>Fetching products from PHP API…</p>
                    </div>
                )}

                {/* Error state */}
                {!isLoading && error && (
                    <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Error loading catalog</p>
                            <p className="text-sm mt-0.5 text-red-400/80">{error}</p>
                        </div>
                    </div>
                )}

                {/* Products grid */}
                {!isLoading && !error && (
                    <>
                        <p className="text-slate-500 text-sm mb-6">{products.length} products found</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Catalog;
