# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.3.tar.gz"
  sha256 "f1c799408bd3f68c8cd490c932c1314c08fb86a13f0a4584c607d6338d1ccd69"
  license "MIT"

  depends_on "gh"

  def install
    zsh_completion.install "_act"
  end

  def caveats
    <<~EOS
      zsh completions have been installed to:
        /opt/homebrew/share/zsh/site-functions
    EOS
  end
end
