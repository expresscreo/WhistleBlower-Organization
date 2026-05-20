import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', organizationName: '', email: '', password: '', plan: '' });
  const [isExistingOrg, setIsExistingOrg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [plans, setPlans] = useState([]);
  const [orgSuggestions, setOrgSuggestions] = useState([]);
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('name')
          .eq('show_on_pricing', true)
          .neq('name', 'ExpressCreo');
        if (plansError) throw plansError;
        
        const availablePlans = plansData.map(p => p.name);
        setPlans(availablePlans);
        
        const planFromUrl = searchParams.get('plan');
        if (planFromUrl && availablePlans.some(p => p.toLowerCase() === planFromUrl.toLowerCase())) {
          const matchedPlan = availablePlans.find(p => p.toLowerCase() === planFromUrl.toLowerCase());
          setFormData(prev => ({ ...prev, plan: matchedPlan }));
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
      }
    };
    fetchInitialData();
  }, [searchParams, toast]);

  const handleOrgInputChange = async (value) => {
    setFormData(prev => ({ ...prev, organizationName: value, plan: '' }));
    setIsExistingOrg(false);
    if (value.length >= 2) {
      const { data, error } = await supabase
        .from('organizations')
        .select('name, plans(name)')
        .ilike('name', `%${value}%`);
      
      if (error) {
        toast({ variant: "destructive", title: "Error searching organizations", description: error.message });
        setOrgSuggestions([]);
      } else {
        setOrgSuggestions(data);
      }
    } else {
      setOrgSuggestions([]);
    }
  };

  const handleSuggestionClick = (org) => {
    setFormData(prev => ({ ...prev, organizationName: org.name, plan: org.plans?.name || '' }));
    setIsExistingOrg(true);
    setOrgSuggestions([]);
  };

  const handleOrgInputBlur = () => {
     setTimeout(() => {
      if (orgSuggestions.length > 0 && orgSuggestions[0].name.toLowerCase() === formData.organizationName.toLowerCase()) {
        handleSuggestionClick(orgSuggestions[0]);
      }
      setOrgSuggestions([]);
    }, 200);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handlePlanChange = (value) => {
    setFormData(prev => ({ ...prev, plan: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.plan && !isExistingOrg) {
        toast({ variant: "destructive", title: "Plan Required", description: "Please select a plan to continue." });
        return;
    }
    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      data: {
        name: formData.name,
        organization_name: formData.organizationName,
        plan_name: formData.plan,
      },
    });
    setLoading(false);
    if (!error) {
      toast({ title: "Registration Successful!", description: "Please check your email to verify your account." });
      router.push('/login');
    } else {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    }
  };

  const logo = "/WBMedia/general/Logoo - WhistleBlower.webp";

  return (
    <>
      <Helmet>
        <title>Register - WhistleBlower.ng</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
             <Link href="/" className="flex justify-center mb-4">
              <img src={logo} alt="WhistleBlower.ng Logo" className="h-16 w-auto" />
            </Link>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>Become a partner and start managing reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="relative space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  required
                  value={formData.organizationName}
                  onChange={(e) => handleOrgInputChange(e.target.value)}
                  onBlur={handleOrgInputBlur}
                  autoComplete="off"
                  placeholder="Type to find or create an organization"
                />
                 {orgSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-card border mt-1 max-h-40 overflow-y-auto">
                        {orgSuggestions.map(org => (
                            <li key={org.name} onClick={() => handleSuggestionClick(org)} className="p-2 hover:bg-accent cursor-pointer">
                                {org.name}
                            </li>
                        ))}
                    </ul>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleInputChange} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-7 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Choose a Plan</Label>
                <Select onValueChange={handlePlanChange} value={formData.plan} disabled={isExistingOrg}>
                  <SelectTrigger id="plan"><SelectValue placeholder={isExistingOrg ? "Plan determined by organization" : "Select a plan"} /></SelectTrigger>
                  <SelectContent>
                    {plans.map(planName => (
                      <SelectItem key={planName} value={planName}>{planName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {isExistingOrg && (
                    <p className="text-xs text-muted-foreground mt-1">Plan is determined by the selected organization.</p>
                )}
              </div>
              <Button type="submit" className="w-full uppercase" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default RegisterPage;